# STARFRONT WORLD V2 — DOCUMENTATION ARCHIVE MANIFEST
## DANH MỤC KIỂM KÊ & ĐỀ XUẤT LƯU TRỮ TÀI LIỆU LỊCH SỬ

> **Mã văn bản:** DOC-ARCHIVE-MANIFEST-V2.0  
> **Thời điểm lập:** 26/10/2026  
> **Nguyên tắc an toàn:** Không tự xóa tài liệu khỏi source code khi chưa có kho lưu trữ sao lưu đích được xác minh và cấp quyền ghi. Không đưa thông tin nhạy cảm/secret lên CDN công khai.

---

### 1. TỔNG QUAN TÀI LIỆU MARKDOWN TRONG SOURCE REPOSITORY

- **Tổng số tệp Markdown:** 62 tệp.
- **Tệp được Runtime / Test / Scripts đọc trực tiếp:** 4 tệp (Bắt buộc giữ nguyên).
- **Tệp quy chuẩn Canonical & Rules cho giai đoạn tiếp theo:** 24 tệp (Bắt buộc giữ nguyên).
- **Tệp bàn giao & nhật ký cập nhật cốt lõi:** 3 tệp (Bắt buộc giữ nguyên).
- **Tệp báo cáo lịch sử, checkpoint cũ & audit đã nghiệm thu xong:** 31 tệp (Ứng viên đề xuất di chuyển vào kho lưu trữ ngoài).

---

### 2. NHÓM TÀI LIỆU BẮT BUỘC GIỮ NGUYÊN TRONG SOURCE CODE

#### A. Tệp được Runtime / Scripts / Tests đọc trực tiếp (KHÔNG ĐƯỢC CHUYỂN HOẶC XÓA)
1. `stories/valentine/chapter-01.md`: Được `UniversalContentResolver` và `tests/character-category-story-content-e2e.test.ts` đọc qua `fs.readFileSync`.
2. `docs/web-01/WEB01_PUBLIC_IMAGES_INVENTORY.md`: Chứa bảng băm SHA-256 đối soát của 26 tài nguyên canonical; được `github-release-validator.ts` và `release-manifest.ts` tham chiếu.
3. `WORLD_DESIGN.md`: Tài liệu thiết kế hệ thống thế giới, được `sector-lifecycle.ts` và `catchup-engine.ts` dẫn chiếu quy tắc đe dọa (Threat thresholds B.4, F.1, F.2).
4. `docs/WORLD_ADMINCP_CONFIG_REFERENCE.md`: Định mức cấu hình AdminCP, được `combat-v2-engine.ts` và `pilot-survival-engine.ts` tham chiếu.

#### B. Tệp Điều Hành & Handoff Mới Nhất
1. `README.md`: Cổng vào dự án, hướng dẫn khởi chạy ứng dụng.
2. `CHANGELOG.md`: Nhật ký thay đổi toàn diện từ V1 đến V2 hiện tại.
3. `FND7_HANDOFF.md`: Tài liệu handoff canonical mới nhất, đang quản lý tiến trình FND-7 và FND-8.

#### C. Quy Chuẩn Kiến Trúc & Hợp Đồng Hệ Thống Có Hiệu Lực (System Invariants)
1. `FEATURES.md`: Bản đồ tính năng chính thức của STARFRONT.
2. `docs/foundations/FND7_*.md`: Hợp đồng Hạm đội & Tàu chiến (FND-7).
3. `docs/foundations/UI_V2/*.md`: Hợp đồng kiến trúc UI V2 và Design System.
4. `docs/systems/*.md`: Quy tắc Skill, Combat, Gear, Item Balance, Save Data.
5. `docs/WORLD_SYSTEM_INVARIANTS.md`: Các bất biến thế giới vĩnh viễn không được vi phạm.

---

### 3. DANH MỤC TÀI LIỆU LỊCH SỬ ĐỀ XUẤT DI DỜI KHI CÓ KHO SAO LƯU

Các tệp dưới đây là các báo cáo tiến độ, audit và checkpoint trung gian của các giai đoạn đã nghiệm thu xong hoàn tất (Phase 5.x, Phase 6.x, R3 Checkpoint 1..3B). Chúng có thể được đóng gói và chuyển sang kho lưu trữ ngoài (ví dụ Google Drive, nhánh `docs-archive`, hoặc thư mục `archive/` riêng biệt):

| STT | Đường Dẫn Tệp Hiện Tại | Phân Loại | Lý Do Đề Xuất Di Dời | Dung Lượng |
| :---: | :--- | :---: | :--- | :---: |
| 1 | `docs/progress/UNIVERSAL_CDN_R3_CHECKPOINT_1_HANDOFF.md` | Checkpoint cũ | Đã được thay thế bởi CP3B Final | ~15 KB |
| 2 | `docs/progress/UNIVERSAL_CDN_R3_CHECKPOINT_2_HANDOFF.md` | Checkpoint cũ | Đã được thay thế bởi CP3B Final | ~18 KB |
| 3 | `docs/progress/UNIVERSAL_CDN_R3_CHECKPOINT_2_1_HANDOFF.md` | Checkpoint cũ | Đã được thay thế bởi CP3B Final | ~14 KB |
| 4 | `docs/progress/UNIVERSAL_CDN_R3_CP3A_HANDOFF.md` | Checkpoint cũ | Đã được thay thế bởi CP3B Final | ~22 KB |
| 5 | `docs/progress/UNIVERSAL_CDN_R3_CP3B_FINAL_HANDOFF.md` | Handoff cũ | CDN R3 đã nghiệm thu hoạt động ổn định | ~26 KB |
| 6 | `docs/progress/FND8/ART01_PILOT_ARTWORK_CDN_RELEASE_R2_HANDOFF.md` | Handoff cũ | Release R2 đã tích hợp xong | ~12 KB |
| 7 | `docs/progress/FND8/FND8_8_2_3_E0_CHECKPOINT.md` | Checkpoint cũ | Đã được thay thế bởi FND8.2.3.x | ~16 KB |
| 8 | `docs/progress/FND8/FND8_8_2_3_E0_HANDOFF.md` | Handoff cũ | Đã được thay thế bởi FND8.2.3.x | ~20 KB |
| 9 | `docs/progress/FND8/FND8_8_2_3_E0_PROGRESS.md` | Tiến độ cũ | Đã được thay thế bởi FND8.2.3.x | ~14 KB |
| 10 | `docs/progress/FND8/FND8_HOTFIX_ENV_DESKTOP_SHELL.md` | Báo cáo hotfix | Hotfix ENV & Desktop Shell đã đóng gói | ~10 KB |
| 11 | `docs/progress/FND8/PILOT_CHARACTER_DATA_UI_STORY_HANDOFF.md` | Handoff cũ | Đã hoàn thành nghiệm thu | ~18 KB |
| 12 | `docs/progress/FND8/STARFRONT_HANDOFF_FND8_2026-10-20.md` | Snapshot cũ | Handoff theo ngày cũ | ~15 KB |
| 13 | `docs/progress/FND8/STARFRONT_HANDOFF_FND8_2026-10-22_UI_POLICY_DELTA.md` | Snapshot cũ | Handoff theo ngày cũ | ~12 KB |
| 14 | `docs/progress/FND8/STORY01_PLAN_HANDOFF.md` | Kế hoạch cũ | Story UI Final đã hoàn thành | ~16 KB |
| 15 | `docs/progress/FND7_HANDOVER_REPORT.md` | Báo cáo cũ | Đã tổng hợp vào FND7_HANDOFF.md | ~11 KB |
| 16 | `docs/progress/METADATA_COVERAGE_REPORT.md` | Audit cũ | Audit metadata đã nghiệm thu | ~8 KB |
| 17 | `docs/progress/UI_V2/FND_UI_V2_CHECKPOINT.md` | Checkpoint cũ | UI V2 Shell đã ổn định | ~14 KB |
| 18 | `docs/progress/UI_V2/FND_UI_V2_HANDOFF.md` | Handoff cũ | UI V2 Shell đã ổn định | ~18 KB |
| 19 | `docs/progress/UI_V2/FND_UI_V2_PROGRESS.md` | Tiến độ cũ | UI V2 Shell đã ổn định | ~12 KB |
| 20 | `docs/PHASE_6_34A_FND_1_SHARED_CATALOG_DATA_FOUNDATION.md` | Phase cũ | Giai đoạn 6.34A đã nghiệm thu | ~15 KB |
| 21 | `docs/PHASE_6_34A_FND_2_SHARED_PROGRESSION_TIER_FOUNDATION.md` | Phase cũ | Giai đoạn 6.34A đã nghiệm thu | ~14 KB |
| 22 | `docs/PHASE_6_34A_FND_3_SHARED_DECISION_EVENT_FOUNDATION.md` | Phase cũ | Giai đoạn 6.34A đã nghiệm thu | ~16 KB |
| 23 | `docs/PHASE_6_34A_FND_4_POPULATION_WORKFORCE_FOUNDATION.md` | Phase cũ | Giai đoạn 6.34A đã nghiệm thu | ~15 KB |
| 24 | `docs/PHASE_6_34A_FND_5_BUILDING_PRODUCTION_FOUNDATION.md` | Phase cũ | Giai đoạn 6.34A đã nghiệm thu | ~18 KB |
| 25 | `docs/PHASE_6_34A_FND_6_BASE_FOUNDATION_ACCEPTANCE.md` | Nghiệm thu cũ | Giai đoạn 6.34A đã nghiệm thu | ~20 KB |
| 26 | `docs/PHASE_6_34A_RESCUE_ARCHITECTURE_PLAN.md` | Kế hoạch cũ | Giai đoạn 6.34A đã nghiệm thu | ~14 KB |
| 27 | `docs/FND8_E0_FINAL_ACCEPTANCE.md` | Nghiệm thu cũ | Bản nháp E0 đã thay bằng FND8.2.3.x | ~12 KB |
| 28 | `docs/STARFRONT_FOUNDATION_DEFAULT_INIT_AUDIT_FND1_FND4.md` | Audit lịch sử | Audit FND1-4 đã kết thúc | ~22 KB |
| 29 | `PHASE_5_9_IMPLEMENTATION_REPORT.md` | Báo cáo cũ | Báo cáo Phase 5.9 đã đóng | ~8 KB |
| 30 | `WORLD_UI_REVIEW.md` | Review cũ | Đã tích hợp vào UI V2 | ~68 KB |
| 31 | `WORLD_UI_UX_AUDIT.md` | Audit cũ | Đã tích hợp vào UI V2 | ~36 KB |

---

### 4. QUY TRÌNH DI CHUYỂN AN TOÀN KHI CÓ KHO LƯU TRỮ ĐÍCH

Khi người dùng cung cấp kho lưu trữ ngoài đã được xác minh (ví dụ Google Cloud Storage Bucket `gs://starfront-docs-archive/` hoặc kho tài liệu riêng):

```bash
# Lệnh sao lưu kiểm chứng trước khi di dời:
# 1. Đóng gói danh mục 31 tệp lịch sử:
tar -czvf starfront-docs-history-archive.tar.gz $(cat docs/DOCUMENTATION_ARCHIVE_MANIFEST.md | grep -o 'docs/[^ ]*\.md' | sort -u)

# 2. Xác thực tính nguyên vẹn gói lưu trữ:
tar -tvf starfront-docs-history-archive.tar.gz

# 3. Tải lên kho lưu trữ ngoài đã xác minh quyền ghi:
# gcloud storage cp starfront-docs-history-archive.tar.gz gs://[VERIFIED_ARCHIVE_BUCKET]/
```

> **Ghi chú bảo mật:** Tuyệt đối không đẩy các tệp chứa thông tin xác thực, token cá nhân hoặc bản thảo cốt truyện bảo mật lên bất kỳ CDN công khai nào.
