#!/usr/bin/env python3
"""
EvRutini İkonu Oluşturucu
SVG'yi PNG'ye çevirir ve farklı boyutlarda üretir
"""

try:
    from PIL import Image, ImageDraw, ImageFont
    import math
except ImportError:
    print("PIL/Pillow kurulu değil. Kuruyorum...")
    import subprocess
    import sys
    subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow"])
    from PIL import Image, ImageDraw, ImageFont
    import math

def create_icon(size=1024):
    """Telif-safe EvRutini ikonu oluştur"""
    
    # Yeni görsel oluştur
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # iOS style rounded rectangle background
    corner_radius = int(size * 0.22)  # iOS app icon radius
    
    # Gradient background effect (basit mavi)
    background_color = (107, 115, 255, 255)  # #6B73FF
    draw.rounded_rectangle([(0, 0), (size, size)], 
                          radius=corner_radius, 
                          fill=background_color)
    
    # Ev ikonu çizimi
    center_x, center_y = size // 2, size // 2
    house_size = int(size * 0.15)  # Ev boyutu
    
    # Ev çatısı (üçgen)
    roof_points = [
        (center_x, center_y - house_size),  # üst nokta
        (center_x - house_size, center_y),  # sol alt
        (center_x + house_size, center_y),  # sağ alt
    ]
    draw.polygon(roof_points, fill=(255, 255, 255, 255))
    
    # Ev gövdesi (dikdörtgen)
    house_body = [
        (center_x - house_size * 0.8, center_y),
        (center_x + house_size * 0.8, center_y + house_size * 1.2)
    ]
    draw.rounded_rectangle(house_body, radius=5, fill=(255, 255, 255, 255))
    
    # Kapı
    door = [
        (center_x - house_size * 0.25, center_y + house_size * 0.3),
        (center_x + house_size * 0.25, center_y + house_size * 1.2)
    ]
    draw.rounded_rectangle(door, radius=3, fill=background_color)
    
    # Pencere (sol)
    window_left = [
        (center_x - house_size * 0.7, center_y + house_size * 0.1),
        (center_x - house_size * 0.4, center_y + house_size * 0.4)
    ]
    draw.rounded_rectangle(window_left, radius=2, fill=background_color)
    
    # Pencere (sağ)
    window_right = [
        (center_x + house_size * 0.4, center_y + house_size * 0.1),
        (center_x + house_size * 0.7, center_y + house_size * 0.4)
    ]
    draw.rounded_rectangle(window_right, radius=2, fill=background_color)
    
    # Döngü simgesi (sağ üst köşe)
    arrow_x = center_x + house_size * 1.5
    arrow_y = center_y - house_size * 1.5
    arrow_radius = int(house_size * 0.6)
    
    # Basit döngü ok çizimi (çember + ok)
    circle_bbox = [
        (arrow_x - arrow_radius, arrow_y - arrow_radius),
        (arrow_x + arrow_radius, arrow_y + arrow_radius)
    ]
    draw.arc(circle_bbox, start=0, end=270, 
             fill=(255, 255, 255, 200), width=int(size * 0.015))
    
    # Ok ucu
    arrow_tip_size = int(house_size * 0.3)
    arrow_points = [
        (arrow_x + arrow_radius - 10, arrow_y - arrow_radius),
        (arrow_x + arrow_radius + arrow_tip_size, arrow_y - arrow_radius - arrow_tip_size),
        (arrow_x + arrow_radius - arrow_tip_size, arrow_y - arrow_radius + arrow_tip_size)
    ]
    draw.polygon(arrow_points, fill=(255, 255, 255, 200))
    
    return img

def main():
    print("🏠 EvRutini telif-safe ikon oluşturuluyor...")
    
    # Farklı boyutlarda ikonlar
    sizes = {
        'icon.png': 1024,           # App Store
        'adaptive-icon.png': 1024,   # Android
        'splash-icon.png': 1024,     # Splash
        'favicon.png': 48            # Web
    }
    
    for filename, size in sizes.items():
        icon = create_icon(size)
        filepath = f"assets/{filename}"
        icon.save(filepath, "PNG", quality=95)
        print(f"✅ {filepath} oluşturuldu ({size}x{size}px)")
    
    print("\n🎉 Tüm ikonlar başarıyla oluşturuldu!")
    print("📁 assets/ klasöründe kontrol edin.")
    print("\n⚡ Bu ikonlar %100 telif-safe!")
    print("   - Kendi tasarımımız")
    print("   - Basit geometric şekiller")  
    print("   - Hiçbir marka/logo kopyası yok")

if __name__ == "__main__":
    main()