# STARFRONT WORLD V2 — 8.2.3.E.2 — Valentine Character Definition Draft

Status: **DRAFT / REVIEW**, not locked lore. Class icon, stats, Traits previously approved; names, canon places, dates, history await WORLD Canon audit.

## Character Identity / UI content
- `classId`: `valentine`
- `classCharacterName`: Valentine
- Full lore name: Valentine Aurelia Vance
- Callsign: Mercy Wing
- Title: Ánh Sáng Cuối Cùng (The Last Light)
- Role: Quân Y Chiến Trường (Combat Medic) · Cứu Hộ (Rescue)
- Gender: Female; age: 24
- Origin: Khu dân cư y tế quỹ đạo Elysia
- Training: Học viện Quân y Không gian
- Personality: Ấm áp, kiên trì, ân cần, giàu lòng trắc ẩn
- Weakness: Khó chấp nhận phải bỏ lại người khác; đôi khi đặt bản thân vào nguy hiểm
- Dream: Không một tín hiệu cầu cứu nào bị lãng quên
- Specialization: Cứu hộ chiến trường, hỗ trợ khiên, điều phối sơ tán
- `characterQuote`: “Chừng nào còn một tín hiệu cầu cứu, tôi sẽ không bỏ lại ai phía sau.”
- `shortDescription`: Một nữ phi công cứu hộ luôn nở nụ cười dịu dàng, ngay cả khi bản thân cô vẫn chưa tha thứ cho một quyết định trong quá khứ.
- Base: ATK=2, DEF=2, AGI=2, ENE=6, SHD=6, LUK=2 (total 20).
- Traits: Bàn Tay Cứu Hộ — Passive +30% Medic recovery; Mái Khiên Nhân Ái — Passive +30% support-skill Shield Recovery. Approved V2 Trait catalog is authoritative.

## Biography Summary (STORY intro)
Valentine sinh ra ở vành đai quỹ đạo Elysia, nơi các đoàn tàu y tế thường xuyên đi qua những tuyến biên giới nguy hiểm. Cô trưởng thành trong môi trường cứu hộ và tin rằng sức mạnh của người phi công nằm ở số người có thể đưa trở về.

Trong một cuộc sơ tán, Valentine phải lựa chọn giữa đoàn tàu chở hàng trăm bệnh nhân và nhóm đồng đội mất liên lạc. Cô cứu đoàn tàu, nhưng không thể cứu những người còn lại. Quyết định ấy trở thành động lực để cô tiếp tục học hỏi công nghệ hỗ trợ khiên và cứu hộ.

## STORY / Chapter 01 — Ánh sáng cuối cùng tại Elysia
Elysia từng là một khu dân cư quỹ đạo nổi tiếng bởi những trung tâm y tế và hành lang vận tải nhân đạo. Valentine lớn lên giữa tiếng động cơ tàu cứu thương, những ca trực kéo dài của mẹ và những câu chuyện về người cha thường xuyên đi cùng các đoàn cứu trợ xa xôi.

Từ nhỏ, cô đã tin rằng cứu một sinh mạng không chỉ là chữa lành vết thương, mà còn là cho người đó cơ hội trở về với gia đình.

Sau khi tốt nghiệp Học viện Quân y Không gian, Valentine gia nhập một đơn vị cứu hộ chiến trường. Khác với nhiều phi công tìm kiếm chiến thắng hoặc danh tiếng, cô quan tâm nhiều hơn đến số người trở về sau mỗi nhiệm vụ. Đồng đội thường nhớ đến nụ cười bình thản của cô, kể cả giữa những tình huống nguy hiểm.

Rồi một cuộc sơ tán quy mô lớn tại Elysia đã thay đổi mọi thứ.

Trong lúc tuyến phòng thủ sụp đổ, Valentine nhận được hai tín hiệu cầu cứu. Một đến từ đoàn vận tải chở hàng trăm bệnh nhân; tín hiệu còn lại phát ra từ một nhóm đồng đội đang mắc kẹt trong khu vực bị phong tỏa.

Không còn đủ thời gian cho cả hai, cô đưa ra lựa chọn cứu đoàn vận tải.

Hàng trăm người sống sót. Nhưng nhóm đồng đội kia không bao giờ trở về.

Valentine được trao bằng khen vì quyết định ấy. Cô chưa từng trưng bày nó.

Từ đó, Valentine chuyên sâu vào công nghệ hồi phục chiến trường và vận hành khiên cứu hộ. Cô không tin mình có thể sửa chữa quá khứ, nhưng vẫn tin rằng mỗi sinh mạng được cứu hôm nay là một lý do để tiếp tục.

> “Tôi không hứa rằng mọi người sẽ không bị thương. Nhưng tôi hứa sẽ làm tất cả những gì có thể để đưa họ trở về.”

Story images: zero by default; up to three optional registered images per chapter. Additional outfit/pose/activity/event art belongs to expandable Gallery.

## UI mapping
- Character Selection: `characterQuote` + `shortDescription` as distinct text blocks, identity, attributes, traits, compact bio facts, View Details / Choose Class.
- Character Category: OVERVIEW includes quote and short description, CHARACTER INFO, art preview. STORY includes biography summary and chapter text, GALLERY expandable registered art; GEAR COMPAT independent.
- `characterName` on Pilot Instance is user/NPC-assigned and MUST NOT inherit this class's fictional personal history.

## Asset paths
`/images/valentine-fullbody.webp`, `/images/valentine-portrait.webp`; additional `/images/valentine-{combat|casual|closeup}.webp` and dynamic indexed variants under approved asset naming.


## APPROVED V2.0: Valentine — 10 chapter roadmap and image priorities

The initial V2.0 roadmap comprises **10 chapters** (approved outline, not ten finished stories). Chapter 01 approved for content. Chapters 02–10 remain to be written and reviewed. Further chapters can be appended after launch without a schema change.

**Production priority:** (1) Selection fullbody + portrait, (2) Gallery art variants, (3) Story artwork when budget allows. Story art is OPTIONAL (0–3 per chapter); no broken images or placeholder displayed when absent. The writer reserves a stable `assetId`, a descriptive prompt/brief and exact chapter placement. Art must be marked ready only after file exists and manifest is updated.

**Chapter 01 image placeholder** `valentine-story-001` → `/images/valentine-story-001.webp`, optional, status PLANNED, after the closing vow quotation. Illustration: adult blonde Valentine in white/teal sci-fi medic dress, full-body, orbital rescue station after Elysia emergency, serene resolve, style consistent with approved V2 visual concepts. NOT YET GENERATED. No further story art presumed.
