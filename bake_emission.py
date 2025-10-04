"""
🔥 Blender Emission Baking Script
Автоматизація процесу запікання emission в текстури для GLB моделей

Використання:
1. Відкрийте Blender
2. File > Import > glTF 2.0 (.glb/.gltf) - завантажте вашу модель
3. Відкрийте Scripting workspace
4. Вставте цей скрипт і натисніть Run Script
5. Готовий файл буде збережено з суфіксом "_baked.glb"

Що робить скрипт:
- Знаходить всі матеріали з emissive властивостями
- Створює UV-розгортку (якщо немає)
- Запікає emission в texture
- Замінює emissive shader на texture
- Експортує GLB з запеченими ефектами
"""

import bpy
import os
from pathlib import Path

def clear_scene():
    """Очищення сцени"""
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    
def setup_render_engine():
    """Налаштування рендер движка для baking"""
    bpy.context.scene.render.engine = 'CYCLES'
    bpy.context.scene.cycles.device = 'GPU' if bpy.context.preferences.addons['cycles'].preferences.has_active_device() else 'CPU'
    bpy.context.scene.cycles.samples = 128  # Достатньо для emission

def has_emission(material):
    """Перевірка чи має матеріал emission"""
    if not material.use_nodes:
        return False
    
    for node in material.node_tree.nodes:
        if node.type == 'EMISSION':
            return True
        if node.type == 'BSDF_PRINCIPLED':
            # Перевірка Emission у Principled BSDF
            emission_input = node.inputs.get('Emission')
            emission_strength = node.inputs.get('Emission Strength')
            if emission_input and emission_input.default_value[0] > 0:
                return True
            if emission_strength and emission_strength.default_value > 0:
                return True
    return False

def create_uv_map(obj):
    """Створення UV розгортки"""
    if not obj.data.uv_layers:
        print(f"   Створення UV для {obj.name}...")
        bpy.context.view_layer.objects.active = obj
        obj.select_set(True)
        bpy.ops.object.mode_set(mode='EDIT')
        bpy.ops.mesh.select_all(action='SELECT')
        bpy.ops.uv.smart_project(angle_limit=66, island_margin=0.02)
        bpy.ops.object.mode_set(mode='OBJECT')
        return True
    return False

def bake_emission_to_texture(obj, material, texture_size=1024):
    """Запікання emission в текстуру"""
    print(f"   🔥 Baking emission для матеріалу: {material.name}")
    
    # Створення нової текстури
    image_name = f"{material.name}_emission_baked"
    image = bpy.data.images.new(image_name, texture_size, texture_size, alpha=True)
    
    # Створення Image Texture node для baking
    nodes = material.node_tree.nodes
    bake_node = nodes.new('ShaderNodeTexImage')
    bake_node.image = image
    bake_node.select = True
    nodes.active = bake_node
    
    # Налаштування об'єкта для baking
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    
    # Baking emission
    try:
        bpy.ops.object.bake(
            type='EMIT',
            use_clear=True,
            margin=4,
            use_selected_to_active=False
        )
        print(f"   ✅ Emission запечено в {image_name}")
    except Exception as e:
        print(f"   ❌ Помилка baking: {e}")
        return None
    
    return image

def replace_emission_with_texture(material, baked_image):
    """Заміна emission shader на запечену текстуру"""
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    
    # Знаходимо Material Output
    output_node = None
    for node in nodes:
        if node.type == 'OUTPUT_MATERIAL':
            output_node = node
            break
    
    if not output_node:
        return False
    
    # Створюємо Image Texture node з запеченою текстурою
    texture_node = nodes.new('ShaderNodeTexImage')
    texture_node.image = baked_image
    texture_node.location = (-400, 300)
    
    # Створюємо Emission shader для запеченої текстури
    emission_node = nodes.new('ShaderNodeEmission')
    emission_node.location = (-200, 300)
    
    # З'єднуємо: Texture -> Emission -> Output
    links.new(texture_node.outputs['Color'], emission_node.inputs['Color'])
    links.new(emission_node.outputs['Emission'], output_node.inputs['Surface'])
    
    # Видаляємо старі emission nodes
    for node in list(nodes):
        if node.type == 'EMISSION' and node != emission_node:
            nodes.remove(node)
        if node.type == 'BSDF_PRINCIPLED':
            # Зберігаємо base color, але вимикаємо emission
            node.inputs['Emission Strength'].default_value = 0
    
    print(f"   ✅ Матеріал {material.name} оновлено з запеченою текстурою")
    return True

def process_object(obj):
    """Обробка одного об'єкта"""
    if obj.type != 'MESH':
        return 0
    
    print(f"\n📦 Обробка об'єкта: {obj.name}")
    baked_count = 0
    
    # Перевірка UV
    created_uv = create_uv_map(obj)
    if created_uv:
        print(f"   ✅ UV розгортка створена")
    
    # Обробка матеріалів
    for slot in obj.material_slots:
        material = slot.material
        if not material:
            continue
        
        if has_emission(material):
            print(f"   🔍 Знайдено emission в матеріалі: {material.name}")
            
            # Baking emission
            baked_image = bake_emission_to_texture(obj, material)
            if baked_image:
                # Заміна emission на texture
                replace_emission_with_texture(material, baked_image)
                baked_count += 1
    
    return baked_count

def bake_emission_for_scene():
    """Головна функція - обробка всієї сцени"""
    print("\n" + "="*60)
    print("🔥 ПОЧАТОК ЗАПІКАННЯ EMISSION В ТЕКСТУРИ")
    print("="*60)
    
    # Налаштування рендера
    setup_render_engine()
    
    # Обробка всіх mesh об'єктів
    total_baked = 0
    mesh_objects = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH']
    
    if not mesh_objects:
        print("❌ Немає mesh об'єктів у сцені!")
        return False
    
    print(f"\n📊 Знайдено {len(mesh_objects)} об'єктів для обробки\n")
    
    for obj in mesh_objects:
        baked = process_object(obj)
        total_baked += baked
    
    print("\n" + "="*60)
    print(f"✅ ЗАПІКАННЯ ЗАВЕРШЕНО: {total_baked} матеріалів запечено")
    print("="*60 + "\n")
    
    return total_baked > 0

def export_glb_with_baked_emission(output_path=None):
    """Експорт GLB з запеченими ефектами"""
    if not output_path:
        # Використовуємо шлях поточного .blend файлу
        blend_file = bpy.data.filepath
        if blend_file:
            output_path = blend_file.replace('.blend', '_baked.glb')
        else:
            output_path = os.path.join(os.path.expanduser('~'), 'Desktop', 'model_baked.glb')
    
    print(f"\n💾 Експорт у: {output_path}")
    
    # Експорт GLB
    try:
        bpy.ops.export_scene.gltf(
            filepath=output_path,
            export_format='GLB',
            export_image_format='AUTO',
            export_materials='EXPORT',
            export_colors=True,
            export_texcoords=True,
            export_normals=True,
            export_lights=True,
            export_yup=True
        )
        print(f"✅ Модель експортована: {output_path}")
        return True
    except Exception as e:
        print(f"❌ Помилка експорту: {e}")
        return False

def main():
    """Головна функція скрипта"""
    print("\n" + "🔥"*30)
    print("     BLENDER EMISSION BAKER")
    print("🔥"*30 + "\n")
    
    # Baking процес
    success = bake_emission_for_scene()
    
    if success:
        # Експорт результату
        export_glb_with_baked_emission()
        print("\n🎉 Готово! GLB з запеченими ефектами збережено!")
    else:
        print("\n⚠️ Не знайдено emission матеріалів для запікання")

# ============================================================================
# ЗАПУСК СКРИПТА
# ============================================================================

if __name__ == "__main__":
    main()


# ============================================================================
# ДОДАТКОВІ ФУНКЦІЇ ДЛЯ РУЧНОГО ВИКОРИСТАННЯ
# ============================================================================

def import_and_bake(input_glb_path, output_glb_path=None):
    """
    Повний цикл: імпорт GLB -> baking -> експорт
    
    Використання:
    import_and_bake('/path/to/model.glb', '/path/to/output.glb')
    """
    print(f"\n📥 Імпорт моделі: {input_glb_path}")
    
    # Очищення сцени
    clear_scene()
    
    # Імпорт GLB
    try:
        bpy.ops.import_scene.gltf(filepath=input_glb_path)
        print("✅ Модель завантажена")
    except Exception as e:
        print(f"❌ Помилка імпорту: {e}")
        return False
    
    # Baking
    success = bake_emission_for_scene()
    
    if success:
        # Експорт
        if not output_glb_path:
            output_glb_path = input_glb_path.replace('.glb', '_baked.glb')
        
        return export_glb_with_baked_emission(output_glb_path)
    
    return False


# Приклад пакетної обробки
def batch_bake(input_folder, output_folder=None):
    """
    Пакетна обробка всіх GLB файлів у папці
    
    Використання:
    batch_bake('/path/to/models/', '/path/to/output/')
    """
    input_path = Path(input_folder)
    output_path = Path(output_folder) if output_folder else input_path
    
    glb_files = list(input_path.glob('*.glb'))
    
    print(f"\n📦 Знайдено {len(glb_files)} GLB файлів для обробки\n")
    
    for glb_file in glb_files:
        output_file = output_path / f"{glb_file.stem}_baked.glb"
        print(f"\n{'='*60}")
        print(f"Обробка: {glb_file.name}")
        print(f"{'='*60}")
        
        import_and_bake(str(glb_file), str(output_file))
    
    print(f"\n🎉 Пакетна обробка завершена!")
