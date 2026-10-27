# STARFRONT WORLD V2 — VALENTINE STORY v1.1
## TASK 01: BÁO CÁO KIỂM KÊ & ĐỐI CHIẾU KHÓA CANON CỐT TRUYỆN VALENTINE (AUDIT ONLY)

**Mã tài liệu:** `VALENTINE_STORY_V1_1_CANON_RECOVERY_AUDIT.md`  
**Chế độ thực thi:** `DEFINE / AUDIT ONLY` — Tuyệt đối không thay đổi mã nguồn, runtime resolver hay xuất bản CDN trong tác vụ này.  
**Thời điểm kiểm kê:** 2026-10-27  
**Phạm vi:** Phi công Valentine Aurelia Vance (Callsign: Mercy Wing) — Chương 01 đến Chương 07.  
**Trạng thái môi trường:** 
- AI Studio Sandbox nội bộ: Đã quét toàn bộ hệ thống file repository (`stories/`, `staging/`, `docs/`, `lib/`, `.starfront-config/`).
- ChatGPT Library bên ngoài: **Chưa thể truy cập trực tiếp** do ranh giới sandbox bảo mật của AI Studio (ghi nhận theo nguyên tắc kiểm định độc lập). Toàn bộ dữ liệu đối chiếu với Library dựa trên các trường metadata canonical (`canonicalLibraryTitle`, `conflictDetails`), các tài liệu handoff `FND8` và câu hỏi kiểm chứng của Chủ dự án.

---

### 1. BẢNG KIỂM KÊ TOÀN DIỆN CHAPTER 01–07 (VALENTINE AURELIA VANCE)

| Chương | Tiêu đề Hiện tại (Runtime) | Tiêu đề Canon Đối chiếu (Library / Editorial) | Timeline & Địa điểm Sự kiện | Nguồn Toàn văn Thực tế & Số từ | Trạng thái Duyệt (Editorial) | Trạng thái Phát hành (Publication) | Scene Anchors & Artwork Hiện diện | Tình trạng Xung đột & Nguồn Bằng chứng |
| :---: | :--- | :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| **01** | **Ánh sáng cuối cùng tại Elysia** | **Ánh sáng cuối cùng tại Elysia** *(Đồng thuận 100%)* | **Năm 24 tuổi (Hiện tại)**<br>Khu dân cư y tế quỹ đạo Elysia trong thảm họa sụp đổ phòng tuyến | `stories/valentine/chapter-01.md`<br>`stories/valentine/chapter-01.json`<br>`docs/art-direction/PILOT/VALENTINE/FND8_8_2_3_VALENTINE_PROFILE_STORY_DRAFT.md`<br>**780 từ** | `APPROVED` | **PUBLISHED**<br>(Đã đồng bộ CDN Staging) | **3 thẻ neo scene**:<br>1. `val-ch01-scene-academy` (`valentine-portrait.webp`)<br>2. `val-ch01-scene-evac` (`valentine-fullbody.webp`)<br>3. `val-ch01-scene-resolve` (`valentine-activity-001.webp`) | **KHÔNG CÓ XUNG ĐỘT**.<br>Toàn văn hoàn chỉnh, đã được chủ dự án ký duyệt.<br>*Bằng chứng:* `character-profile-data.ts:260-285`, `chapter-01.meta.json`. |
| **02** | **Ca trực đầu tiên tại Trạm Cứu hộ Quỹ đạo** | **Lời Thề Dưới Những Vì Sao** | **Giai đoạn khởi nghiệp**<br>Trạm Cứu hộ Quỹ đạo tiền tuyến; bão điện từ không gian | `stories/valentine/chapter-02.json`<br>**180 từ** *(Chỉ có tóm tắt đề cương)* | `APPROVED` | `REVIEW_ONLY`<br>(Giữ ở `DRAFT`) | **1 thẻ neo scene**:<br>1. `val-ch02-scene-uniform` (`valentine-uniform-001.webp`) | **XUNG ĐỘT TIÊU ĐỀ**:<br>Runtime dùng tiêu đề báo cáo hành chính/nhiệm vụ; Library dùng tiêu đề văn học biểu cảm.<br>*Bằng chứng:* `stories/valentine/manifest.json:53-54`, `chapter-02.json:6-9`. |
| **03** | **Tín hiệu bị cô lập ở Vành đai Asteroid** | **Đôi Cánh Mang Hy Vọng** | **Sau sự kiện sơ tán**<br>Vành đai Tiểu hành tinh Asteroid Delta; bãi mảnh vỡ tàu chiến | `stories/valentine/chapter-03.json`<br>**190 từ** *(Chỉ có tóm tắt đề cương)* | `APPROVED` | `REVIEW_ONLY`<br>(Giữ ở `DRAFT`) | **1 thẻ neo scene**:<br>1. `val-ch03-scene-activity` (`valentine-activity-001.webp`) | **XUNG ĐỘT DANH TỪ RIÊNG & TIÊU ĐỀ**:<br>Truy vấn nhắc đến Helios-7, GEAR Aster, LightSpeed-Phoenix nhưng repo chỉ có Vành đai Asteroid.<br>*Bằng chứng:* `stories/valentine/manifest.json:78`, `chapter-03.json:6-9`. |
| **04** | **Lằn ranh đỏ giữa hai mệnh lệnh** | **Một Ngày Không Tiếng Còi Báo Động** | **Giai đoạn phục vụ tiền tuyến**<br>Chiến trường giáp ranh; khoảnh khắc nghỉ hiếm hoi trước biến cố | `stories/valentine/chapter-04.json`<br>**210 từ** *(Chỉ có tóm tắt đề cương)* | `APPROVED` | `REVIEW_ONLY`<br>(Giữ ở `DRAFT`) | **1 thẻ neo scene**:<br>1. `val-ch04-scene-casual` (`valentine-casual.webp`) | **XUNG ĐỘT TIÊU ĐỀ & TÂM LÝ**:<br>Runtime nhấn mạnh xung đột kỷ luật quân sự; Library nhấn mạnh khoảng lặng bình yên ngắn ngủi.<br>*Bằng chứng:* `stories/valentine/chapter-04.json:6-9`. |
| **05** | **Học viện Y sinh Không gian và Lời thề** | **Những Người Không Trở Về** | **Tiền truyện (Flashback)**<br>Học viện Quân y / Y sinh Không gian Elysia; giai đoạn tân sinh viên | `stories/valentine/chapter-05.json`<br>**160 từ** *(Chỉ có tóm tắt đề cương)* | `PROVISIONAL` | `REVIEW_ONLY`<br>(Khóa xuất bản) | **0 thẻ neo** *(Text-only, không có tranh)* | **XUNG ĐỘT BIÊN NIÊN SỬ (TIMELINE ANOMALY)**:<br>Nội dung là thời kỳ đào tạo (trước Chương 01) nhưng lại đặt ở Chương 05. Tiêu đề Library nói về sự mất mát.<br>*Bằng chứng:* `chapter-05.json:6-9`. |
| **06** | **Chuyến bay thử nghiệm của Mercy Wing** | **Thiên Thần Trong Ánh Đèn Trắng** | **Tiền truyện trước khi nhận nhiệm vụ**<br>Khu thử nghiệm hàng không quân sự quỹ đạo | `stories/valentine/chapter-06.json`<br>**170 từ** *(Chỉ có tóm tắt đề cương)* | `PROVISIONAL` | `REVIEW_ONLY`<br>(Khóa xuất bản) | **0 thẻ neo** *(Text-only, không có tranh)* | **XUNG ĐỘT TRỌNG TÂM NỘI DUNG**:<br>Runtime nói về thử nghiệm máy phát khiên kép; Library gợi tả hình ảnh y bác sĩ tại phòng phẫu thuật cấp cứu.<br>*Bằng chứng:* `chapter-06.json:6-9`. |
| **07** | **Bí mật bên dưới tầng ngầm Elysia** | **Bí mật bên dưới tầng ngầm Elysia** | **Hậu bối cảnh sơ tán**<br>Tầng sâu nghiên cứu năng lượng và sinh học dưới trạm Elysia | *Không có file JSON/MD trong repo*<br>**95 từ** *(Đề cương tóm tắt trong manifest)* | `HOLD`<br>*(Niêm phong cấp II)* | `REVIEW_ONLY`<br>(Khóa cứng API) | **0 thẻ neo** | **NIÊM PHONG TUYỆT ĐỐI**:<br>Chưa có văn bản giải mật. Cấm đưa lên CDN hoặc hiển thị cho người dùng.<br>*Bằng chứng:* `STORY01_IMMERSIVE_READER_PUBLICATION_PLAN.md:269`. |

---

### 2. DANH SÁCH XUNG ĐỘT CANON & PHÂN TÍCH CHUYÊN SÂU

#### 2.1. Xung đột Chapter 02: Tiêu đề & Sắc thái
- **Tiêu đề Runtime hiện tại:** `Ca trực đầu tiên tại Trạm Cứu hộ Quỹ đạo`
- **Tiêu đề ChatGPT Library / Văn học:** `Lời Thề Dưới Những Vì Sao`
- **Phân tích bản chất:**
  - *Hệ Runtime (Technical/Military)*: Tập trung vào thủ tục điều lệnh, nhật ký ca trực và việc tiếp quản buồng lái tàu cứu thương giữa bão từ. Phù hợp phong cách Hard Sci-Fi / Quân sự.
  - *Hệ Library (Literary/Emotional)*: Tập trung vào động cơ nội tâm, khoảnh khắc ngắm nhìn không gian vô tận qua cửa sổ vòm và lời thề y đức dấn thân.
- **Khuyến nghị Canon:** Hợp nhất có phân cấp: Tiêu đề chính giữ phong cách văn học `Lời Thề Dưới Những Vì Sao`, phân đoạn / bối cảnh phụ đề ghi nhận `Ca trực đầu tiên tại Trạm Cứu hộ Quỹ đạo`.

#### 2.2. Xung đột Chapter 03: Vành đai Asteroid vs Các danh từ riêng lạ
- **Hiện trạng kiểm tra thực tế trong toàn bộ Repository:**
  - **`Helios-7`:** Không có trong toàn bộ codebase hay tài liệu thế giới quan. Hệ thống chỉ có `Vành Đai Helios` (Sector Helios Perimeter), `Bão Mặt Trời Helios`, và sự kiện `Trận chiến trạm thu năng lượng Helios` (thuộc lore của Selena). "Nhiệm vụ Helios-7" là thực thể chưa từng được nhập vào repo.
  - **`LightSpeed-Phoenix`:** Không xuất hiện trong bất kỳ tài liệu nào của STARFRONT. Mọi phi thuyền và mecha cứu hộ của Valentine đều thuộc lớp `Mercy Wing` hoặc tàu cứu thương bọc thép tiêu chuẩn.
  - **`GEAR Aster`:** Không xuất hiện trong catalog GEAR/Mecha. Chỉ có địa danh `Asteroid Delta` (Trạm trung chuyển Sector 1) và `Vành đai Tiểu hành tinh Asteroid`.
- **Tiêu đề đối chiếu:**
  - Runtime: `Tín hiệu bị cô lập ở Vành đai Asteroid`
  - Library: `Đôi Cánh Mang Hy Vọng`
- **Kết luận Audit:** Các danh từ `Helios-7`, `LightSpeed-Phoenix`, `GEAR Aster` có thể xuất phát từ một bản nháp phân nhánh ngoài ChatGPT Library chưa đồng bộ vào Canonical Design của STARFRONT. Nếu chấp nhận các danh từ này, cần tạo bản đăng ký thuật ngữ chính thức (Terminology Register) để tránh phá vỡ World Invariants của FND-1.

#### 2.3. Xung đột Chapter 04–06: Timeline Nghịch đảo (Biên niên sử)
- **Hiện trạng sắp xếp:**
  - Chương 01: Sự kiện bước ngoặt lớn nhất — Cuộc sơ tán Elysia (Valentine đã là phi công thực thụ, 24 tuổi).
  - Chương 02: Ca trực đầu tiên / Lời thề (Giai đoạn tân binh).
  - Chương 03: Cứu phi công tiêm kích ở Asteroid Delta (Nhiệm vụ thực địa).
  - Chương 04: Bất tuân lệnh rút lui để cứu phân đội tiếp tế (Xung đột kỷ luật).
  - Chương 05: Học viện Y sinh Không gian (Thời sinh viên — **Lùi về quá khứ xa nhất**).
  - Chương 06: Chuyến bay thử nghiệm nguyên mẫu Mercy Wing (Giai đoạn thử nghiệm công nghệ).
- **Phân tích:** 
  Cấu trúc hiện tại đang xen lẫn giữa tuyến tính kịch tính (In Medias Res — mở đầu bằng biến cố lớn nhất ở Chương 01) và các chương hồi tưởng (Flashbacks ở Chương 05, 06). 
  - Nếu đây là chủ ý nghệ thuật "In Medias Res": Cần bổ sung nhãn thời gian rõ ràng (ví dụ: `[HỒI TƯỞNG: 4 NĂM TRƯỚC SỰ KIỆN ELYSIA]`) trong Metadata để người đọc không bị mất phương hướng.
  - Nếu sắp xếp theo biên niên sử tuyến tính: Thứ tự chuẩn logic phải là: `Chương 05 (Học viện) → Chương 06 (Thử nghiệm) → Chương 02 (Ca trực đầu) → Chương 01 (Biến cố Elysia) → Chương 03 (Asteroid) → Chương 04 (Lằn ranh đỏ)`.

#### 2.4. Trạng thái Biên tập Chapter 05–07
- **Chương 05 & 06:** Mang nhãn `PROVISIONAL`. Theo hiến pháp dự án FND-8, nội dung này chỉ là đề xuất, chưa được ký duyệt chính thức. Tuyệt đối **KHÔNG** tự ý chuyển sang `APPROVED`.
- **Chương 07:** Mang nhãn `HOLD` (Hồ sơ tuyệt mật cấp II). Chưa có bất kỳ văn bản giải mật nào. Giữ nguyên trạng thái niêm phong `CANON_HOLD`.

---

### 3. BẢN THẢO TOÀN VĂN TÌM ĐƯỢC VÀ NGUỒN TƯƠNG ỨNG

1. **Chương 01: Ánh sáng cuối cùng tại Elysia**
   - **Tình trạng:** **ĐÃ CÓ TOÀN VĂN ĐẦY ĐỦ (FULL_PROSE).**
   - **Độ dài:** **780 từ** văn xuôi tiếng Việt hoàn chỉnh.
   - **Số đoạn văn (`blocks`):** 12 đoạn văn xuôi mạch lạc.
   - **Các phân cảnh đã liên kết:** 3 thẻ neo (`val-ch01-scene-academy`, `val-ch01-scene-evac`, `val-ch01-scene-resolve`).
   - **Nguồn lưu trữ chứng minh:**
     - Tệp Markdown: `stories/valentine/chapter-01.md`
     - Tệp Cấu trúc JSON: `stories/valentine/chapter-01.json` và `staging/starfront-world-assets/stories/pilots/valentine/chapter-01.json`
     - Tài liệu Thiết kế Gốc: `docs/art-direction/PILOT/VALENTINE/FND8_8_2_3_VALENTINE_PROFILE_STORY_DRAFT.md`
     - Runtime Registry: `lib/game/v2/character-profile-data.ts:260-285`

2. **Chương 02 đến 06:**
   - **Tình trạng:** **CHƯA CÓ BẢN THẢO TOÀN VĂN TRONG REPOSITORY.**
   - Hiện chỉ tồn tại các bản tóm tắt đề cương cốt truyện ngắn (160 – 210 từ) trong các tệp `stories/valentine/chapter-02.json` đến `chapter-06.json`.
   - Các tệp này được đánh dấu chính xác là `SUMMARY_ONLY` kèm ghi chú: `> BẢN THẢO TÓM TẮT — CHỜ PHÊ DUYỆT TOÀN VĂN TÁC GIẢ`.

3. **Chương 07:**
   - **Tình trạng:** **HOÀN TOÀN CHƯA CÓ VĂN BẢN (MISSING).**
   - Chỉ có dòng tóm tắt 95 từ trong manifest: *"Hồ sơ niêm phong cấp độ II. Chưa mở khóa nội dung."*

---

### 4. DANH SÁCH NHỮNG GÌ CÒN THIẾU ĐỂ XUẤT BẢN ĐỦ 7 CHƯƠNG

1. **Văn bản gốc hoàn chỉnh từ Tác giả / Biên kịch:**
   - Cần 6 bản thảo văn xuôi hoàn chỉnh (mỗi chương từ 800 đến 1.200 từ) cho Chương 02, 03, 04, 05, 06, 07.
   - Tuyệt đối giữ vững nguyên tắc: **Không dùng AI tự bịa văn xuôi để lấp đầy.**
2. **Quyền truy cập hoặc Bản xuất (Export) từ ChatGPT Library:**
   - Do môi trường AI Studio không thể tự kết nối mạng vào kho lưu trữ cá nhân ngoài luồng, Chủ dự án cần paste hoặc cung cấp văn bản trích xuất từ ChatGPT Library cho các chương 02–07.
3. **Quyết định thẩm định thuật ngữ Canon:**
   - Xác nhận có đưa các danh từ `Helios-7`, `LightSpeed-Phoenix`, `GEAR Aster` vào thế giới quan chính thức hay quy chuẩn về hệ thống danh xưng hiện có (`Vành đai Asteroid`, `Mercy Wing Mecha`, `Sector Helios Perimeter`).
4. **Văn bản phê duyệt nâng cấp trạng thái:**
   - Chữ ký duyệt chuyển Chương 05 & 06 từ `PROVISIONAL` thành `APPROVED`.
   - Lệnh giải mật (Unseal) chuyển Chương 07 từ `HOLD` thành `APPROVED`.

---

### 5. CÁC QUYẾT ĐỊNH CẦN CHỦ DỰ ÁN PHÊ DUYỆT

Để khóa Canon v1.1, đề xuất Chủ dự án xem xét và chọn phương án cho 5 quyết định cốt lõi:

#### Quyết định 1: Chuẩn hóa Bảng Tiêu đề Canon (Chapter Titles)
- **Phương án A (Ưu tiên Văn học — Khuyến nghị):** Dùng tiêu đề ChatGPT Library làm tiêu đề chính, đưa tiêu đề hiện tại thành phụ đề/bối cảnh.
  - Ch01: *Ánh sáng cuối cùng tại Elysia*
  - Ch02: *Lời Thề Dưới Những Vì Sao* (Phụ đề: Ca trực đầu tiên tại Trạm Cứu hộ Quỹ đạo)
  - Ch03: *Đôi Cánh Mang Hy Vọng* (Phụ đề: Tín hiệu bị cô lập ở Vành đai Asteroid)
  - Ch04: *Một Ngày Không Tiếng Còi Báo Động* (Phụ đề: Lằn ranh đỏ giữa hai mệnh lệnh)
  - Ch05: *Những Người Không Trở Về* (Phụ đề: Học viện Y sinh Không gian và Lời thề)
  - Ch06: *Thiên Thần Trong Ánh Đèn Trắng* (Phụ đề: Chuyến bay thử nghiệm của Mercy Wing)
  - Ch07: *Bí mật bên dưới tầng ngầm Elysia*
- **Phương án B (Giữ nguyên tiêu đề Runtime hiện tại):** Giữ nguyên toàn bộ 7 tiêu đề đang có trên hệ thống giao diện.

#### Quyết định 2: Xác nhận Danh từ Riêng & Trang thiết bị
- Xác nhận xem Valentine có từng lái chiến hạm/chiến cơ tên là `LightSpeed-Phoenix` và thực hiện `nhiệm vụ Helios-7` với `GEAR Aster` hay không?
  - *Lựa chọn 2.1:* **ĐỒNG Ý BỔ SUNG VÀO CANON.** Đội ngũ kỹ thuật sẽ cập nhật từ điển FND-1 và danh mục GEAR để bổ sung `LightSpeed-Phoenix`, `Helios-7`, `GEAR Aster`.
  - *Lựa chọn 2.2:* **QUY CHUẨN VỀ DANH TỪ REPO HIỆN CÓ.** Giữ nguyên lớp chiến cơ `Mercy Wing Prototype`, bối cảnh `Trạm trung chuyển Asteroid Delta` và chiến dịch bảo vệ trạm năng lượng `Helios`.

#### Quyết định 3: Thứ tự Trình bày Hồi ký (Timeline Order)
- *Lựa chọn 3.1:* **Giữ nguyên thứ tự hiện hành (In Medias Res)** — Mở đầu bằng biến cố sơ tán Elysia (Chương 01), các chương sau đóng vai trò hồi ức và phát triển tâm lý. Bổ sung nhãn phân mốc thời gian rõ ràng.
- *Lựa chọn 3.2:* **Tái cấu trúc theo Biên niên sử Tuyến tính** — Đưa Chương 05 (Học viện) lên làm Chương 01, Chương 06 (Thử nghiệm) lên làm Chương 02, Chương 01 (Sơ tán) thành Chương 03...

#### Quyết định 4: Thẩm định Trạng thái Biên tập (Editorial Status)
- Giữ nguyên trạng thái đã duyệt: Ch01–Ch04 = `APPROVED`, Ch05–Ch06 = `PROVISIONAL`, Ch07 = `HOLD` cho đến khi có bản thảo toàn văn mới.

#### Quyết định 5: Hình thức Bàn giao Văn bản Toàn văn
- Chủ dự án cung cấp trực tiếp bản thảo văn xuôi Chương 02–07 (từ ChatGPT Library) qua cửa sổ trao đổi để hệ thống chuyển đổi thành định dạng chuẩn JSON `blocks[]` và thẻ neo CDN.

---

### 6. KẾ HOẠCH BƯỚC TIẾP THEO (SAU KHI CHỦ DỰ ÁN KHÓA CANON)

1. **Bước 1 (Tiếp nhận Văn bản):** Sau khi Chủ dự án phê duyệt 5 quyết định trên và cung cấp bản thảo toàn văn Chương 02–07.
2. **Bước 2 (Đóng gói Dữ liệu):** Biên tập thẻ neo `<!-- story-anchor -->` tương ứng với các tranh đã có sẵn trên CDN (`valentine-uniform-001.webp`, `valentine-activity-001.webp`, `valentine-casual.webp`).
3. **Bước 3 (Chuyển đổi Staging):** Tạo các file `chapter-02.json` ... `chapter-07.json` với `"contentStatus": "FULL_PROSE"`, cập nhật manifest.
4. **Bước 4 (Xuất bản CDN):** Đẩy gói tài nguyên lên CDN Staging và kích hoạt runtime release an toàn qua AdminCP.

---

**DỪNG BƯỚC (STOPPED AT CHECKPOINT):** Báo cáo đã hoàn tất ở chế độ `AUDIT ONLY`. Không có bất kỳ thay đổi nào đối với mã nguồn hoặc trạng thái xuất bản hiện hành. Chờ phản hồi phê duyệt từ Chủ dự án.
