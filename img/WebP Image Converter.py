import os
import sys
import re
from PIL import Image

def natural_keys(text):
    """
    숫자가 포함된 문자열을 '자연어 순서'로 정렬하기 위한 키 함수입니다.
    예: aoi (2) -> ['aoi (', 2, ')']
    """
    return [int(c) if c.isdigit() else c.lower() for c in re.split(r'(\d+)', text)]

def convert_to_webp(root_folder, quality=100):
    extensions = ('.jpg', '.jpeg', '.png', '.bmp', '.tiff')

    for root, dirs, files in os.walk(root_folder):
        # 파일 목록을 자연어 순서로 정렬합니다.
        files.sort(key=natural_keys)
        
        for file in files:
            if file.lower().endswith(extensions):
                file_path = os.path.join(root, file)
                base_path = os.path.splitext(file_path)[0]
                output_path = f"{base_path}.webp"

                try:
                    with Image.open(file_path) as img:
                        img.save(output_path, "WEBP", quality=quality)
                    
                    os.remove(file_path)
                    print(f"변환 완료: {file} -> {os.path.basename(output_path)}")
                
                except Exception as e:
                    print(f"에러 발생 ({file}): {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("폴더를 이 파일 위로 드래그 앤 드롭해 주세요.")
    else:
        target_path = sys.argv[1]
        
        if os.path.isdir(target_path):
            print(f"작업을 시작합니다: {target_path}")
            convert_to_webp(target_path)
            print("\n모든 이미지의 정렬 및 변환이 완료되었습니다!")
        else:
            print("폴더 경로가 올바르지 않습니다.")
    
    input("\n종료하려면 엔터를 누르세요...")