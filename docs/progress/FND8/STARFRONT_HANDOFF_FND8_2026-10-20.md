# STARFRONT WORLD — HANDOFF CHO CHAT MỚI
Ngày lập: 2026-10-20. Ngôn ngữ làm việc: tiếng Việt. Vai trò: người dùng là game designer (anh); trợ lý là kiến trúc sư gameplay/UI-UX (em).

## CHỈ DẪN CHO CHAT MỚI
Đọc tài liệu này làm ngữ cảnh để TIẾP TỤC THIẾT KẾ FND-8, không tự code hay tạo prompt triển khai cho đến khi người dùng duyệt thiết kế. Mỗi lần chỉ thảo luận/chốt **một mục nhỏ** với UI/UX trực quan, hỏi một quyết định cần thiết. Tất cả mockup UI/UX được người dùng phê duyệt phải làm **khung tham chiếu tối thiểu bắt buộc** trong Feature MD, có thể làm đẹp thêm nhưng không bỏ tính năng. Ưu tiên hiệu năng WORLD (I/O, AI, React render, game-day simulation), SYSTEM config và không hardcode. Trả lời bằng tiếng Việt, tự nhiên, ngắn gọn vừa đủ; không bắt người dùng nhắc lại quy tắc đã duyệt.

## TRẠNG THÁI
- FND-7 SHIP/FLEET FOUNDATION: thiết kế 15/15 đã được duyệt. AI Studio hoàn tất DEFINE/PLAN ONLY và báo Phase 7.1 Master Data Catalog & Schemas IMPLEMENT DONE (12/12 test, regression FND5 7/7, FND6 19/19, tsc 0, build success **theo báo cáo**, chưa được xác minh trực tiếp). Phase 7.2 Ship Entity & MK I-X được chuẩn bị/chạy tiếp độc lập. FND-7 đang được triển khai ở AI Studio song song với thiết kế FND-8.
- FND-8 PILOT/GEAR/COMBAT V2: **8.1 APPROVED 100%**; 8.2 là mục sắp thảo luận. Roadmap tạm thời 15 mục, chưa duyệt hết. **KHÔNG gọi V1.1; phiên bản chính thức V2**.

## FND-8 — NHỮNG QUYẾT ĐỊNH ĐÃ CHỐT
1. **Phương án 2**: XÂY MỚI hoàn toàn FND-8 Pilot/GEAR/Character/World Combat V2 với architecture của Foundation FND-1 `Type → Class → Definition → Instance`, SYSTEM Catalog Registry, SYSTEM `system_*_data.json`. Dùng dữ liệu/code V1 **chỉ để tham khảo có chọn lọc**, không chuyển nguyên runtime V1 sang Framework. Có thể định nghĩa lại toàn bộ Stats, Skills, Character, GEAR, Combat và các UI phù hợp V2.
2. **Giữ nguyên V1 có thể chơi trong khi V2 đang xây**, không đụng Combat V1 hay sửa runtime V1 trong khi FND-7 chạy; V2 xây độc lập, sau khi hoàn thiện sẽ lập kế hoạch cutover riêng. Người dùng cho phép reset WORLD hoặc clear các save phần liên quan nếu cần **ở giai đoạn chuyển đổi và phải làm rõ/phê duyệt trước**, tránh reset bất ngờ.
3. Character/Pilot: V1 có **8 Character (4 nam, 4 nữ)**; **V2 phải có 12 Character (4 nam, 8 nữ)**: giữ/reuse **ảnh fullbody và portrait** của 8 mẫu cũ nếu phù hợp, thiết kế/định nghĩa lại dữ liệu của cả 8; bổ sung 4 nữ **trưởng thành**, ngoại hình quyến rũ/gợi cảm, đa phong cách (ví dụ thư ký, học đường trưởng thành, cá tính, bí ẩn). Không tự nhận biết tên/IDs/Stats V1 nếu chưa đọc code/assets; user sẵn sàng cung cấp ảnh, MD, trích xuất AI Studio khi cần. Đừng mặc định các concept minh họa đã duyệt chi tiết.
4. **Một Pilot Instance độc lập ↔ một GEAR Instance cá nhân**, 1:1, không share cùng một GEAR giữa Pilot khác nhau. Pilot sở hữu, quản lý, mua, sửa và nâng cấp GEAR/Equipment/Modules với tiền/tài sản hợp lệ. Mỗi Pilot (Player và NPC giả lập người chơi) có danh tính, ID, Level, Attributes, Skills, inventory, lịch sử, hành vi AI và hoạt động thực tế. NPC Pilot có thể ở Guild/Fleet, Base, Nation, làm freelancer, event/mission, tham chiến lớn. Player/NPC dùng chung Stats/Rules, khác quyền điều khiển.
5. **GEAR**: V1 có 3 loại; V2 thiết kế mới khoảng **6 hoặc 8 loại** (người dùng nghiêng về **8** nhưng chưa khóa chính thức); có thể mở rộng ở V2.1. Stats/equipment/visual/skills độc lập và thống nhất qua catalog. Không tự chốt danh sách Gear Type trước khi cùng thiết kế.
6. **WORLD Combat V2 làm mới**, không phải chỉ adapter vào Combat V1. Combat V1 là nguồn tham khảo; người dùng đánh giá UI Combat/Map/Mission V1 xấu và khó đọc nên **V2 cần thiết kế lại toàn bộ UI/UX** (Combat HUD, Mission HUD, Maps, Character, GEAR, Pilot). Ưu tiên trực quan, dễ đọc, global semantic typography/text scale/layout density. Các mockup HUD đã được duyệt là chuẩn UX tối thiểu; không sao chép UI cũ.
7. **Hybrid NPC Simulation cho hiệu năng:** lưu bền Pilot Instance riêng cho mọi NPC, chọn số Pilot active để chạy AI/Combat chi tiết; background NPC cập nhật theo Game-Day/event/batch; indexed access, virtualization/lazy HUD, không render/tính từng NPC mỗi frame; quy mô số NPC tính toán đồng thời, population cap/config chỉ chốt sau khi cân nhắc benchmark/WORKLOAD. Có thể limits qua SYSTEM Definition/AdminCP.
8. Naming: NPC tên random phù hợp giới tính/hình mẫu/văn hóa, tên ổn định trên save/load (không đổi khi render). Character Definition là archetype có thể dùng bởi nhiều NPC với identity riêng.
9. Pilot/GEAR không đồng nhất với FND-7 operational Personnel workforce pool. Pilot là named individual; Crew/Workforce là nhóm nhân sự. Nation/Base/Fleet ownership và command authority FND-7 phải được tôn trọng.
10. UI/UX tối thiểu đã được người dùng **đồng ý** cho FND-8: Pilot Profile HUD có portrait, name, type (PLAYER/NPC), Level, active status, GEAR type/MK, Guild, Current Base, Specialty, AI Activity, Mission, GEAR Status, Skill Training; mới làm lại, không dùng giao diện V1.

## ROADMAP FND-8 TẠM ĐỀ XUẤT (CHƯA CHỐT)
8.1 Pilot / GEAR Core Architecture (**DONE**).
8.2 Character Definitions V2 — 12 Character (4M/8F), reuse V1 images, data/rebalance mới (**NEXT**).
8.3 Pilot Identity, Naming & NPC Generation.
8.4 Pilot Attributes / Level / Progression.
8.5 Skills / Talents / Specializations.
8.6 GEAR Type / Class / Definition / Instance (6–8 types TBD).
8.7 GEAR Ownership / Equipment / Modules.
8.8 Pilot–GEAR Compatibility & Customization.
8.9 NPC Pilot AI / Personality / Decisions.
8.10 Freelancer / Guild / Fleet / Base / Nation.
8.11 Training / Recruitment / Recovery.
8.12 WORLD Combat V2 / Large-scale Battles.
8.13 Economy / Purchasing / Pilot Assets.
8.14 NPC Population Simulation / Performance.
8.15 WORLD Registry / New UI/UX / Save / Migration.
Roadmap có thể mở rộng hơn 15 mục để bao phủ Combat/Map/Mission V2 cho đúng yêu cầu mới của người dùng; **không mặc định cứng 15 mục nếu thiếu phạm vi**. Chốt từng phần.

## MỘT SỐ QUY TẮC NỀN FND-7 CẦN BIẾT KHI THIẾT KẾ FND-8
- Nation, Base và Fleet có Treasury/Assets/Inventory độc lập; không dịch chuyển tài sản vô căn cứ.
- Fleet owner, Registered HQ và Current Location độc lập; Fleet AI phát triển/hậu cần và tài chính tự trị; Base chỉ yêu cầu cho nhiệm vụ thường, National emergency legal orders đặc thù.
- Fleet Pilot Named Individuals vs Workforce Pool; movement/temporary assignment không teleport; cơ chế Crew, Academy/Employment Center.
- FND-7 hỗ trợ Fleet founder NPC, Fleet lifecycle (forming/active/reorganization/disband); NEW_GUILD_PROTECTION gồm miễn FRAME Decay, subsidy Credits sau FULL eligibility cycle, repair/ship buying/recruitment discount buffs với usage counters; anti-abuse per-person history. Các hệ thống mới FND-8 phải tương thích định danh Pilot.
- FND-7 FRAME: Cycle, Available, Total, Annual decay dựa National Avg Cycle / 2, max 50% Total per fleet, configurable, protection default 10 game years (KHÔNG phải 360 ngày); financial ledger/credits actual treasury.
- Chú ý AI Studio FND-7 report từng mâu thuẫn thiết kế: 4 Fleet Types được seed vs 6 types đã phê duyệt (Defense, Assault, Recon, Logistics, Support, Escort), và `NEW_GUILD_PROTECTION` bị ghi 360 ngày vs mặc định 10 năm; mk I-V trong catalog mặc dù ship Tier đòi I-X. **Chỉ là CẢNH BÁO từ báo cáo, không tự khẳng định mã nguồn sai khi chưa verify.** Ghi lại cho user soát sau khi xong checkpoint; không tự làm dừng FND-7.

## QUY TRÌNH MẶC ĐỊNH AI STUDIO CHO MỌI FND SAU
- Prompt A: `DEFINE / PLAN ONLY`: đọc repo, lập Feature/Architecture/Full UIUX Reference MD, SYSTEM data catalog/schema, implementation phased roadmap, PROGRESS/HANDOFF. Không code gameplay hoặc lén chạy phases. User duyệt thiết kế trước.
- Prompt B: `IMPLEMENT / RESUME ONE PHASE`: đọc MD + last checkpoint, chạy đúng một Phase hoặc subphase/turn (chia nhỏ nếu quá lớn để tránh hết quota), targeted tests+build khi cần, ghi MD progress/handoff, git revision/commit nếu có; account khác đọc đúng checkpoint và tiếp tục, không làm lại toàn bộ verification. Không báo DONE khi chưa xong.
- Mọi prompt AI Studio bằng tiếng Việt, AI Studio trả lời tiếng Việt. SYSTEM Policies config, không hardcode. Các UI mockup đã được duyệt là **minimum skeleton**.

## TIẾP TỤC Ở CHAT MỚI
Bắt đầu **8.2 — Character Definitions V2**, xác định data model 12 Character (4M/8F), reuse V1 portraits/fullbody, thiết kế lại Character data và một HUD Character Selection mẫu trực quan. Chỉ hỏi duyệt một quyết định. Không yêu cầu người dùng đợi FND-7 hoặc chuyển repo, và không tự viết prompt FND-8 lúc này. Có thể nhắc tới việc lấy manifest V1 từ AI Studio trong bước DEFINE sau nếu cần, nhưng không block thảo luận thiết kế hiện tại.
