import os
import sys
from datetime import datetime

def rename_images_in_folder(folder_path):
    # 지원할 이미지 확장자 목록
    image_extensions = ('.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp')
    
    if not os.path.isdir(folder_path):
        print(f"[오류] '{folder_path}'는 올바른 폴더 경로가 아닙니다.")
        return

    print(f"작업을 시작합니다. 대상 폴더: {folder_path}\n" + "-"*50)
    
    files = os.listdir(folder_path)
    count = 0

    for file_name in files:
        ext = os.path.splitext(file_name)[1].lower()
        
        if ext in image_extensions:
            full_path = os.path.join(folder_path, file_name)
            
            try:
                # [수정 포인트] getctime(생성시간) 대신 getmtime(수정시간)을 사용합니다.
                # 복사/이동된 파일은 수정시간에 원본 생성 일자가 남아있는 경우가 많습니다.
                timestamp = os.path.getmtime(full_path)
                date_time = datetime.fromtimestamp(timestamp)
                
                # 새로운 파일 이름 포맷 (YYYYMMDD_HHMMSS)
                new_name = date_time.strftime("%Y%m%d_%H%M%S")
                
                new_file_name = f"{new_name}{ext}"
                new_full_path = os.path.join(folder_path, new_file_name)
                
                duplicate_counter = 1
                while os.path.exists(new_full_path):
                    new_file_name = f"{new_name}_{duplicate_counter}{ext}"
                    new_full_path = os.path.join(folder_path, new_file_name)
                    duplicate_counter += 1
                
                os.rename(full_path, new_full_path)
                print(f"[변경 완료] {file_name} -> {new_file_name}")
                count += 1
                
            except Exception as e:
                print(f"[실패] {file_name} 변경 중 오류 발생: {e}")

    print("-"*50)
    print(f"총 {count}개의 이미지 파일 이름 변경을 완료했습니다.")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        target_folder = sys.argv[1]
        rename_images_in_folder(target_folder)
    else:
        print("오류: 폴더를 이 스크립트 파일 위로 드래그해서 실행해 주세요.")
    
    input("\n엔터 키를 누르면 창이 닫힙니다...")