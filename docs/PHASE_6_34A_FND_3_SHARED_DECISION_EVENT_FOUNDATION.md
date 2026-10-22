# STARFRONT WORLD — PHASE 6.34A-FND-3
# SHARED DECISION / EVENT INTERACTION FOUNDATION

> **TÀI LIỆU BÀN GIAO KIẾN TRÚC & TRIỂN KHAI NỀN TẢNG (HANDOFF ARCHITECTURE)**  
> **Trạng thái:** HOÀN TẤT (DONE)  
> **Phạm vi:** Nền tảng Shared Decision & Event Interaction dùng chung, độc lập miền (domain-agnostic), phục vụ việc ra quyết định, phê chuẩn nâng cấp, điều phối chiến lược và tương tác sự kiện. Tích hợp trực tiếp trên FND-1 (Catalog) và FND-2 (Progression).

---

## 1. CÁC TẬP TIN ĐÃ TẠO VÀ CẬP NHẬT (FILES CREATED / UPDATED)

### Thư mục triển khai mới: `lib/game/world/decision/`
1. `lib/game/world/decision/types.ts`: Định nghĩa các kiểu cốt lõi: DecisionStatus (`PENDING`, `APPROVED`, `REJECTED`, `INVALIDATED`), DecisionFallbackPolicy, DecisionSource, DecisionPriority, GenericEntityRef, GenericPayloadRef, SharedDecision, HubDecisionNotification, DecisionEngineState.
2. `lib/game/world/decision/seed-data.ts`: Dữ liệu chuẩn tắc SYSTEM cho 4 catalogs: fallback policy, decision source, decision type, decision priority.
3. `lib/game/world/decision/engine.ts`: Động cơ lõi `SharedDecisionEngine`, quản lý vòng đời 4 trạng thái, kiểm soát xung đột phạm vi (MaxActivePendingPerScope = 1), xử lý thời hạn timeout theo GAME_DAY, chính sách thay thế/hủy bỏ, xuất/nhập trạng thái bền vững và chiếu thông báo UI Hub.
4. `lib/game/world/decision/registry-integration.ts`: Tích hợp với FND-1 `CatalogRegistry` và tự động nạp cấu hình SYSTEM vào `defaultCatalogRegistry`.
5. `lib/game/world/decision/progression-integration.ts`: Cầu nối trực tiếp với FND-2 Shared Progression: tạo đề xuất nâng cấp Tier (`TIER_UPGRADE_RECOMMENDATION`), xác thực điều kiện và kích hoạt đột phá Tier khi được phê chuẩn.
6. `lib/game/world/decision/index.ts`: Barrel export toàn bộ public API của decision foundation.

### Tệp dữ liệu Master Catalog chuẩn tắc: `data/catalogs/`
- `data/catalogs/system_decision_fallback_policy_data.json`
- `data/catalogs/system_decision_decision_source_data.json`
- `data/catalogs/system_decision_decision_type_data.json`
- `data/catalogs/system_decision_decision_priority_data.json`

### Tích hợp và Kiểm thử:
- `lib/game/world/index.ts`: Re-export decision module vào WORLD API.
- `tests/world/phase-6-34a-fnd-3-decision.test.ts`: Bộ kiểm thử 32 subtests bao quát 35 yêu cầu, **PASS 100%**.

---

## 2. KIẾN TRÚC & HỢP ĐỒNG LÕI (CORE ARCHITECTURE & CONTRACTS)

### 2.1. Vòng đời 4 trạng thái tối giản (Minimal 4-State Lifecycle):
- **`PENDING`**: Quyết định đang chờ Chỉ huy thao tác hoặc chờ tới hạn `timeoutAtGameDay`.
- **`APPROVED`**: Được phê chuẩn bởi Chỉ huy hoặc tự động phê chuẩn qua AI re-evaluation khi timeout.
- **`REJECTED`**: Bị từ chối bởi Chỉ huy hoặc tự động từ chối qua AI/fallback policy.
- **`INVALIDATED`**: Thực thể ngữ cảnh bị phá hủy, điều kiện không còn thỏa mãn, hoặc bị thay thế bởi quyết định mới trong cùng phạm vi. Đóng vĩnh viễn, không chạy timeout nữa.
> *Lưu ý:* Timeout không phải là một trạng thái (không có trạng thái `TIMEOUT`), mà là một tác nhân giải quyết (resolution trigger) dẫn đến `APPROVED`, `REJECTED`, hoặc `INVALIDATED`.

### 2.2. Kiểm soát xung đột phạm vi (MaxActivePendingPerScope = 1):
- Mỗi phạm vi (xác định bởi `decisionScopeKey`, ví dụ: `SHIP:vanguard_01:UPGRADE` hoặc `SECTOR:sec_alpha:DEPLOYMENT`) chỉ được phép có **tối đa 1 quyết định PENDING**.
- Khi xuất hiện quyết định mới trong cùng scope:
  - **`KEEP_EXISTING`**: Giữ quyết định cũ, từ chối quyết định mới.
  - **`REJECT_NEW`**: Từ chối yêu cầu mới.
  - **`REPLACE_EXISTING`**: Đánh dấu quyết định cũ là `INVALIDATED` với lý do `SUPERSEDED_BY_NEW_DECISION` và lưu vết lịch sử; sau đó đưa quyết định mới vào trạng thái `PENDING`.

### 2.3. Xử lý thời hạn theo GAME_DAY (Zero Wall-Clock Dependency):
- `timeoutAtGameDay = createdGameDay + timeoutGameDays`.
- Hoàn toàn độc lập với thời gian trình duyệt (`Date.now()`), tương thích hoàn toàn với mô phỏng WORLD offline và bước nhảy ngày tick.
- Chính sách dự phòng khi hết hạn (`fallbackPolicy`):
  - **`AI_REEVALUATE`**: Đánh giá lại ngữ cảnh: nếu hợp lệ $\rightarrow$ `APPROVED` (`AI_TIMEOUT_APPROVED`); nếu bị chặn/thiếu tài nguyên $\rightarrow$ `REJECTED` (`AI_TIMEOUT_REJECTED`); nếu thực thể không còn tồn tại $\rightarrow$ `INVALIDATED`.
  - **`KEEP_PENDING`**: Duy trì trạng thái chờ, không tự động giải quyết.
  - **`AUTO_REJECT`**: Tự động từ chối khi hết hạn.

### 2.4. Tham chiếu chung (Generic Entity & Payload References):
- Không serialize toàn bộ object vào quyết định:
  - `contextRef: { entityType: "SHIP" | "BUILDING" | "SECTOR" | ..., entityId: string }`
  - `payloadRef: { payloadType: string, payloadId: string, data?: Record<string, any> }`
  - `eventId?: string` (tùy chọn kết nối với Sự Kiện Thiên Hà).

### 2.5. Hợp đồng thông báo UI Hub (Hub Notification Projection):
- Hàm `projectToHubNotification(decision, currentDay)` cung cấp đối tượng hiển thị gọn nhẹ cho UI/HUD:
  `decisionId`, `decisionType`, `title`, `summary`, `priority`, `createdGameDay`, `timeoutAtGameDay`, `contextRef`, `status`, `tags`, `isExpiringSoon`.

### 2.6. Bền vững hóa (State Persistence):
- `engine.exportState()` và `engine.importState(...)` hỗ trợ lưu và nạp trọn vẹn danh sách quyết định `PENDING` cùng toàn bộ nhật ký `history` vào WORLD State.

---

## 3. TÍCH HỢP VỚI FND-1 VÀ FND-2

1. **FND-1 Catalog Registry:**
   - Đăng ký và nạp các danh mục chuẩn tắc `fallback_policy`, `decision_source`, `decision_type`, `decision_priority`.
   - Hỗ trợ ghi đè cấp trường của người dùng (`setOverride`) mà không làm biến đổi tệp gốc SYSTEM canonical.
2. **FND-2 Shared Progression:**
   - Cung cấp hàm `createProgressionUpgradeDecision(...)` khi thực thể đạt trạng thái `AWAITING_UPGRADE` với chính sách `RECOMMEND`.
   - Khi quyết định được phê chuẩn, hàm `applyApprovedProgressionDecision(...)` tự động gọi `startTierUpgrade(...)` của FND-2.

---

## 4. KẾT QUẢ KIỂM THỬ (TEST SUITE VERIFICATION)

Đã thực thi thành công bộ test suite:
`tests/world/phase-6-34a-fnd-3-decision.test.ts` (32 subtests bao quát 35 yêu cầu, **PASS 100%**):

- 1. Create PENDING decision — PASS
- 2. APPROVE manually — PASS
- 3. REJECT manually — PASS
- 4. INVALIDATE manually — PASS
- 5. Invalidation reason, detail & history — PASS
- 6. Timeout + AI_REEVALUATE + approve — PASS
- 7. Timeout + AI_REEVALUATE + reject — PASS
- 8. Timeout + KEEP_PENDING — PASS
- 9. Timeout + AUTO_REJECT — PASS
- 10. Timeout invariant: no separate lifecycle state — PASS
- 11. Invalidated decision does not run fallback — PASS
- 12. Persistence: exportState and importState — PASS
- 13. contextRef resolution — PASS
- 14. payloadRef handling — PASS
- 15. Optional eventId linking — PASS
- 16. Scope rule: MaxActivePendingPerScope = 1 — PASS
- 17. Scope conflict KEEP_EXISTING — PASS
- 18 & 19. Scope conflict REPLACE_EXISTING & SUPERSEDED_BY_NEW_DECISION — PASS
- 20. Scope conflict REJECT_NEW — PASS
- 21. Authoritative decisionSource correctness — PASS
- 22. Array fields (tags, auditFlags, reasonCodes, relatedRefs) — PASS
- 23. Hub notification projection contract — PASS
- 24. History snapshot audit — PASS
- 25 & 26. GAME_DAY timeout & zero wall-clock dependency — PASS
- 27. FND-2 Progression RECOMMEND integration hook — PASS
- 28. SYSTEM default data load through FND-1 registry — PASS
- 29. USER override on decision catalogs — PASS
- 30. Fail-soft unresolved context — PASS
- 31. FND-1 regression check — PASS
- 32. FND-2 regression check — PASS
- 33. Pilot Survival regression check — PASS
- 34 & 35. Full compile & tsc --noEmit — PASS

---

## 5. TƯƠNG THÍCH V1 & ĐIỂM KẾT NỐI TIẾP THEO

- **Không hồi quy (Zero Regression):** Cả 3 nền tảng FND-1, FND-2, FND-3, cùng Pilot Survival SAR và toàn bộ ứng dụng Next.js đều biên dịch và kiểm thử thành công 100%.
- **Điểm kết nối tiếp theo (Next Integration Points):**
  - Tích hợp Shared Decision Engine vào bảng điều khiển chiến lược Operations Center / Events & Missions Hub.
  - Kết nối các khuyến nghị nâng cấp thực thể Ship/Building/Base tự động gửi vào Shared Decision Engine.
