import os
import json

# 이미지가 들어 있는 폴더들
base_dir = "cobubu"
target_folders = ["1500", "1920"]

# 결과를 담을 딕셔너리
image_dict = {}

for folder in target_folders:
    folder_path = os.path.join(base_dir, folder)
    if not os.path.exists(folder_path):
        print(f"❌ 경로 없음: {folder_path}")
        continue

    # 이미지 파일 목록 가져오기 (확장자 필터링)
    image_files = [
        f for f in os.listdir(folder_path)
        if f.lower().endswith((".png", ".jpg", ".jpeg", ".webp", ".gif"))
    ]

    # 정렬 (옵션)
    image_files.sort()

    image_dict[folder] = image_files

# JSON 저장
with open("imageList.json", "w", encoding="utf-8") as f:
    json.dump(image_dict, f, indent=2, ensure_ascii=False)

print("✅ imageList.json 생성 완료")
