# STARFRONT — 8 Anime Sci-Fi Character Art Prompts for PixAI
*Document Version: 1.0 — Generated: October 2026*  
*Project Reference: STARFRONT (Turn-Based Sci-Fi Tactical RPG)*  
*Target Generator: PixAI (Stable Diffusion / Animagine XL / Moonbeam / Whimsical / Anime V3)*

---

## 1. Tổng Quan Kiến Trúc Mỹ Thuật (Art Direction Philosophy & GEAR Visual Bridge)

### 1.1. Triết Lý Thiết Kế: Cầu Nối Giữa Cơ Giáp GEAR Và Nhân Vật Anime
STARFRONT kết hợp thế giới quan cơ khí quân sự vũ trụ đỉnh cao với ngôn ngữ tạo hình nhân vật anime Nhật Bản cao cấp:
- **Cơ sở tham chiếu GEAR (`vanguard-gear.jpg`, `falcon-gear.jpg`, `aegis-gear.jpg`)**: Cung cấp ngôn ngữ vật liệu (hợp kim titan đen mờ, sợi carbon composite nano-weave), các đường rãnh đèn LED vi mạch phát quang, ống xả phản lực hạt ion/plasma, và bảng màu phe phái chính thức.
- **Phong cách nhân vật Pilot (Japanese Anime Sci-Fi Illustration)**: Nhân vật được vẽ theo phong cách tranh minh họa anime cao cấp (tương tự key visual của các tựa game RPG mecha anime hàng đầu). Khuôn mặt anime sắc sảo, mắt vẽ nhiều lớp chi tiết với điểm sáng linh hoạt, tóc xếp lớp tự nhiên, nét line art sạch sẽ và kỹ thuật cel shading kết hợp digital painting mềm mại.
- **Tuyệt đối bài trừ (Anti-Slop / Zero-Pixel Policy)**: Không sử dụng pixel art, retro sprite, voxel, 3D thô sơ, vector phẳng, hay hình vẽ lập trình giả lập. Mọi tác phẩm đều hướng tới chất lượng concept art chính thức.

### 1.2. Hướng Dẫn Sử Dụng Trên Nền Tảng PixAI
Khi nhập dữ liệu vào công cụ sinh ảnh PixAI:
1. **Lựa chọn Model đề xuất**:
   - **Moonbeam** hoặc **Whimsical** (cho phong cách anime điện ảnh, màu sắc rực rỡ và ánh sáng mềm).
   - **Animagine XL V3.1** hoặc **Anime V3** (cho độ bám sát tag trang phục sci-fi và nét vẽ anime chuẩn mực).
   - **Neverland** (cho phong cách concept art huyền ảo, chi tiết vi mô sắc nét).
2. **Kích thước đầu ra chuẩn (Aspect Ratio)**:
   - **Ảnh Chân Dung (Portrait 1:1)**: `1024 × 1024` pixels.
   - **Ảnh Toàn Thân (Full-Body 9:16)**: `896 × 1600` hoặc `900 × 1600` pixels.
3. **Thông số kỹ thuật đề xuất (Generation Parameters)**:
   - **Sampling Steps**: 28 – 34 steps.
   - **CFG Scale**: 6.5 – 7.5.
   - **Sampler**: `DPM++ 2M Karras` hoặc `DPM++ SDE Karras`.
   - **Clip Skip**: 2.
   - **VAE**: `vae-ft-mse-840000-ema-pruned` (hoặc VAE tích hợp sẵn của model).

---

## 2. Chi Tiết 8 Prompt Nhân Vật Phi Công (Pilot Character Prompts)

---

### PILOT 01: Marcus Thorne — WAR DOG

#### A. Hồ Sơ Nhân Vật & Vai Trò Chiến Thuật
- **Họ Tên**: Marcus Thorne
- **Callsign**: WAR DOG *(biệt danh phụ: IRONCLAD)*
- **Giới Tính / Tuổi**: Nam (Male) · 30 tuổi
- **Vai Trò & Chuyên Môn**: Chỉ Huy Tiên Phong / Chuyên Gia Hỏa Lực Hạng Nặng (Vanguard Lead Commander / Weapons Specialist)
- **Cơ Giáp Tham Chiếu (Signature GEAR)**: **Vanguard Gear** (`vanguard-gear.jpg`)
- **Bảng Màu Chủ Đạo**: Xanh Cyan vũ trụ (`#06b6d4`), Đen titan nhám (`#1e293b`), Xanh băng tản nhiệt (`#38bdf8`)
- **Tính Cách & Khí Chất**: Dày dạn trận mạc, điềm tĩnh, tự tin, bản lĩnh người chỉ huy tiền tuyến từng trải qua hàng trăm giờ không chiến tại Vành đai Asteroid.
- **Trích Dẫn Biểu Tượng**: *"Khi đại pháo Vanguard gầm vang, không một chiến tuyến nào có thể đứng vững."*

#### B. Bản Thiết Kế Tạo Hình Chi Tiết (Visual Concept)
- **Khuôn Mặt & Ánh Mắt**: Nam tính, góc cạnh, cằm sắc nét; vết sẹo chiến binh mờ tinh tế trên gò má; ánh mắt màu hổ phách/nâu ấm đầy quyết đoán; nụ cười tự tin khẽ nhếch môi.
- **Mái Tóc**: Tóc đen nhánh pha nâu sẫm tỉa layer ngắn, hơi vuốt dựng phong cách thể thao quân đội.
- **Trang Phục & Giáp**: Ngoại giáp exo-suit bọc titan màu xám than/đen nhám ôm sát cơ thể vạm vỡ; giáp ngực dập nổi logo Vanguard; các rãnh dẫn năng lượng phát sáng màu cyan tươi; cổ áo giáp chiến thuật nâng cao bảo vệ gáy; găng tay cơ khí trợ lực.
- **Trang Bị Kèm Theo**: Khớp gắn bệ pháo ion cá nhân bên vai hoặc súng xung kích plasma cầm tay; thiết bị liên lạc gắn bên tai trái.
- **Ánh Sáng & Bối Cảnh**: Ánh sáng xanh cyan băng giá từ đèn giáp phản chiếu lên gương mặt; hậu cảnh boong tàu sân bay không gian mờ ảo.

#### C. PixAI Positive Prompt (Tag & Descriptive Hybrid)
```text
(masterpiece, best quality, ultra-detailed:1.2), 1boy, solo, marcus thorne, 30 years old handsome rugged male space fighter commander, short spiky dark brown hair, sharp jawline, determined amber eyes, faint battle scar on cheek, confident smirk, athletic muscular build,
futuristic military sci-fi pilot combat suit, titanium exo-suit chestplate, matte dark charcoal carbon-composite armor plating, glowing neon cyan energy circuits, tactical pilot collar, reinforced mechanical shoulder pauldrons, heavy armored pilot gauntlets,
inspired by starfront vanguard gear aesthetic, high-tech aerospace machinery, cyan plasma thruster glow, clean detailed anime line art, refined cel shading with smooth digital painting highlights, cinematic volumetric lighting, dynamic 3/4 angle, official anime rpg concept art
```

#### D. PixAI Negative Prompt
```text
(worst quality, low quality:1.4), (deformed, distorted, disfigured:1.3), pixel art, retro sprite, 8-bit, 16-bit, blocky, chunky, voxel, 3d blender render, low poly, flat vector, svg illustration, chibi, cartoonish, feminine features, blurry, bad anatomy, bad hands, missing fingers, extra digits, cropped, signature, watermark, username, text, logo
```

#### E. Thiết Lập Đề Xuất PixAI
- **Model**: Moonbeam hoặc Animagine XL V3.1
- **Aspect Ratio**: 1:1 (1024×1024) cho Portrait / 9:16 (896×1600) cho Full-body
- **Steps**: 30 | **CFG**: 7.0 | **Sampler**: DPM++ 2M Karras

#### F. Cầu Nối Thẩm Mỹ Với GEAR
- Kế thừa trực tiếp cấu trúc giáp góc cạnh và tông màu Cyan (`#06b6d4`) của **Vanguard Gear**, biến đổi thành dạng exo-suit phi công với đèn báo xả nhiệt ion xanh băng đối xứng.

---

### PILOT 02: Valentine Vance — AEGIS ANGEL

#### A. Hồ Sơ Nhân Vật & Vai Trò Chiến Thuật
- **Họ Tên**: Valentine Vance
- **Callsign**: AEGIS ANGEL *(biệt danh phụ: ANGEL WING)*
- **Giới Tính / Tuổi**: Nữ (Female) · 22 tuổi
- **Vai Trò & Chuyên Môn**: Sĩ Quan Cứu Hộ & Điều Biến Lá Chắn (Rescue & Defense Specialist / Nanotech Shield Operator)
- **Cơ Giáp Tham Chiếu (Signature GEAR)**: **Aegis Gear** (`aegis-gear.jpg`)
- **Bảng Màu Chủ Đạo**: Vàng hổ phách (`#f59e0b`), Xanh ngọc bích nano (`#10b981`), Trắng ngọc trai (`#f8fafc`)
- **Tính Cách & Khí Chất**: Thủ khoa học viện thiên hà, thông minh, nhân hậu, kiêu sa nhưng ấm áp; phong thái bảo bọc đồng đội trước mọi giông bão.
- **Trích Dẫn Biểu Tượng**: *"Lá chắn của tôi sẽ bảo vệ bạn trước mọi hiểm nguy ngoài vũ trụ."*

#### B. Bản Thiết Kế Tạo Hình Chi Tiết (Visual Concept)
- **Khuôn Mặt & Ánh Mắt**: Gương mặt thanh tú, đôi mắt to tròn màu xanh ngọc biển biếc lấp lánh; hàng mi cong mềm mại; làn da trắng mịn với nét ửng hồng nhẹ nhàng; thần thái vừa thánh thiện vừa quyết tâm.
- **Mái Tóc**: Mái tóc dài màu vàng bạch kim óng ả (platinum blonde) gợn sóng buông xõa qua vai, điểm xuyết một lọn tóc tết nhỏ công nghệ cao kẹp vi mạch ngọc bích.
- **Trang Phục & Giáp**: Bộ quân phục phi công váy ngắn nano-weave thanh lịch màu trắng ngọc trai phối viền vàng kim vương giả; đai lưng corset công nghệ cao tôn vóc dáng đồng hồ cát; đôi bốt cao cổ bọc giáp trắng viền vàng; tai nghe truyền tín hiệu cứu hộ hình cánh thiên thần cách điệu.
- **Trang Bị Kèm Theo**: Găng tay điều biến từ trường phát quang ngọc bích, xung quanh bàn tay lơ lửng các khối đa diện khiên năng lượng lục giác bán trong suốt.
- **Ánh Sáng & Bối Cảnh**: Quầng sáng hào quang ngọc bích và hổ phách dịu êm tỏa ra từ trường lực bảo hộ.

#### C. PixAI Positive Prompt (Tag & Descriptive Hybrid)
```text
(masterpiece, best quality, ultra-detailed:1.2), 1girl, solo, valentine vance, 22 years old stunningly beautiful female anime pilot, long flowing platinum blonde wavy hair, soft bangs, expressive crystal cyan-blue eyes, gentle warm smile, elegant youthful face, alluring slender feminine proportions,
futuristic elegant pilot uniform, high-tech white and gold nanofiber bodysuit with stylish pleated miniskirt, gold trim armor accents, glowing emerald green shield nodes, angel-wing shaped comms headset, white armored knee-high boots, floating translucent hexagonal holographic energy shields around hands,
inspired by starfront aegis gear defense aesthetic, clean pristine anime line art, soft cel shading blended with digital painting, gentle luminous emerald rim lighting, warm golden highlights, pristine space station interior backdrop, professional anime key visual
```

#### D. PixAI Negative Prompt
```text
(worst quality, low quality:1.4), (deformed, distorted, disfigured:1.3), pixel art, retro sprite, 8-bit, 16-bit, blocky, chunky, voxel, 3d render, flat vector, svg drawing, dark gritty mud, masculine traits, aggressive frown, blurry, bad anatomy, bad hands, extra fingers, missing fingers, cropped, watermark, text, signature
```

#### E. Thiết Lập Đề Xuất PixAI
- **Model**: Whimsical hoặc Moonbeam (tối ưu nét đẹp nữ tính và ánh sáng ngọc bích)
- **Aspect Ratio**: 1:1 (1024×1024) cho Portrait / 9:16 (896×1600) cho Full-body
- **Steps**: 32 | **CFG**: 6.8 | **Sampler**: DPM++ SDE Karras

#### F. Cầu Nối Thẩm Mỹ Với GEAR
- Kế thừa triết lý phòng thủ bất khả xâm phạm của **Aegis Gear**, chuyển hóa các khối giáp nặng nề thành các cụm module khiên nano thanh thoát, lấy ánh sáng ngọc bích (`#10b981`) làm sợi dây liên kết với Tuyệt kỹ Thánh Vực.

---

### PILOT 03: Alviss Drake — GHOSTFIRE

#### A. Hồ Sơ Nhân Vật & Vai Trò Chiến Thuật
- **Họ Tên**: Alviss Drake
- **Callsign**: GHOSTFIRE
- **Giới Tính / Tuổi**: Nam (Male) · 26 tuổi
- **Vai Trò & Chuyên Môn**: Át Chủ Tiêm Kích Siêu Thanh / Tác Chiến Đánh Chặn (Supersonic Ace / Interceptor Specialist)
- **Cơ Giáp Tham Chiếu (Signature GEAR)**: **Falcon Gear** (`falcon-gear.jpg`)
- **Bảng Màu Chủ Đạo**: Tím neon huyền ảo (`#a855f7`), Tím đậm bóng đêm (`#1e1b4b`), Hổ phách sáng (`#f59e0b`)
- **Tính Cách & Khí Chất**: Sắc lạnh, bí ẩn, phong thái lãng tử không gian với phản xạ thần kinh kinh ngạc 0.07 giây; sở trường nhử địch vào bẫy rồi bứt tốc phản công Mach cực hạn.
- **Trích Dẫn Biểu Tượng**: *"Nhanh hơn ánh sáng, nguy hiểm hơn một tia chớp — bạn chỉ thấy tàn ảnh của tôi."*

#### B. Bản Thiết Kế Tạo Hình Chi Tiết (Visual Concept)
- **Khuôn Mặt & Ánh Mắt**: Đẹp trai sắc sảo kiểu anime bishounen; đôi mắt màu hổ phách rực lửa nhìn thấu chuyển động; sống mũi cao thanh tú; ánh nhìn điềm tĩnh lạnh lùng đầy nguy hiểm.
- **Mái Tóc**: Mái tóc đen tuyền tỉa layer phong trần, vuốt lệch một bên với những lọn highlight màu tím violet phát quang tinh tế.
- **Trang Phục & Giáp**: Bộ flightsuit khí động học ôm sát màu đen tím đêm sâu; cổ áo chịu áp suất cao chống trọng lực; cánh lướt tàn ảnh thu nhỏ tích hợp sau lưng; ống xả vi phản lực ở bắp chân và gót bốt.
- **Trang Bị Kèm Theo**: Kính ngắm ngắm bắn holographic một bên mắt (HUD monocle) màu tím; găng tay cảm biến điều khiển phản xạ vi mô.
- **Ánh Sáng & Bối Cảnh**: Các vệt tàn ảnh quang học (motion blur afterimages) màu tím neon tỏa ra xung quanh cơ thể như bóng ma siêu thanh.

#### C. PixAI Positive Prompt (Tag & Descriptive Hybrid)
```text
(masterpiece, best quality, ultra-detailed:1.2), 1boy, solo, alviss drake, 26 years old handsome bishounen male supersonic ace fighter pilot, messy layered jet-black hair with stylish violet purple highlights, sharp piercing amber eyes, cool calm intense expression, slender athletic aerodynamic build,
aerodynamic supersonic pilot flightsuit, deep midnight violet and matte black carbon fiber fabric, glowing purple neon energy lines, sleek aerodynamic shoulder fins, high-G pressure collar, lightweight composite armor plates, holographic purple HUD monocle over one eye, supersonic afterburner micro-thrusters on calves,
inspired by starfront falcon gear interceptor aesthetic, ethereal purple phantom trail, speed motion blur wisps, crisp anime line art, sharp cel shading with dramatic contrast, cinematic sci-fi neon lighting, deep space starfield background, official anime concept illustration
```

#### D. PixAI Negative Prompt
```text
(worst quality, low quality:1.4), (deformed, distorted, disfigured:1.3), female, girl, pixel art, retro sprite, 8-bit, 16-bit, blocky, chunky, voxel, 3d render, flat vector, svg, blurry, dull colors, bad anatomy, bad hands, extra fingers, missing fingers, cropped, watermark, signature, text, logo
```

#### E. Thiết Lập Đề Xuất PixAI
- **Model**: Moonbeam hoặc Neverland
- **Aspect Ratio**: 1:1 (1024×1024) cho Portrait / 9:16 (896×1600) cho Full-body
- **Steps**: 30 | **CFG**: 7.2 | **Sampler**: DPM++ 2M Karras

#### F. Cầu Nối Thẩm Mỹ Với GEAR
- Kế thừa cánh delta dẹp và động cơ Mach siêu thanh của **Falcon Gear**, tái hiện qua hệ thống cánh lướt lưng thu nhỏ và vệt xả proton tím neon (`#a855f7`).

---

### PILOT 04: Eric Brandt — BUNKER BREAKER

#### A. Hồ Sơ Nhân Vật & Vai Trò Chiến Thuật
- **Họ Tên**: Eric Brandt
- **Callsign**: BUNKER BREAKER
- **Giới Tính / Tuổi**: Nam (Male) · 28 tuổi
- **Vai Trò & Chuyên Môn**: Bậc Thầy Pháo Kích / Phá Hủy Công Thành Xuyên Giáp (Demolition Ace / Heavy Siege Master)
- **Cơ Giáp Tham Chiếu (Signature GEAR)**: **Vanguard / Siege Gear** (`vanguard-gear.jpg`)
- **Bảng Màu Chủ Đạo**: Đỏ thẫm hạt nhân (`#ef4444`), Cam nhiệt nung chảy (`#f97316`), Đen súng kim loại (`#292524`)
- **Tính Cách & Khí Chất**: Dũng mãnh, gan lì, tháo vát; cựu kỹ sư pháo binh dày dạn kinh nghiệm phòng thủ boong-ke Mặt Trăng Đỏ, thấu hiểu từng điểm hàn giáp thép.
- **Trích Dẫn Biểu Tượng**: *"Giáp của đối phương chỉ là một trở ngại tạm thời trước mũi pháo của tôi."*

#### B. Bản Thiết Kế Tạo Hình Chi Tiết (Visual Concept)
- **Khuôn Mặt & Ánh Mắt**: Nam tính phong trần, đường nét rắn rỏi; râu quai nón cắt tỉa gọn gàng; đôi mắt màu xám khói ánh tia lửa nhiệt lượng; ánh nhìn tự tin của kẻ làm chủ bộc phá.
- **Mái Tóc**: Tóc đen hoa than cắt ngắn gọn gàng chịu nhiệt.
- **Trang Phục & Giáp**: Quân phục phi công pháo binh hạng nặng phối màu đen nhám và đỏ thẫm; giáp chống sốc chịu nhiệt dày dặn trước ngực và bắp tay; đai thắt lưng đạn dược chiến thuật tích hợp các thỏi tinh thể năng lượng; khe tản nhiệt phát sáng đỏ cam rực lửa.
- **Trang Bị Kèm Theo**: Súng ngắn nhiệt hạch bẻ khóa boong-ke đeo ngang hông; găng tay chịu nhiệt cơ khí bọc thép gia cường.
- **Ánh Sáng & Bối Cảnh**: Ánh lửa cam rực và tàn tro than hồng bay lơ lửng; ánh sáng đỏ thẫm ấm áp từ khe tản nhiệt phản quang lên gương mặt.

#### C. PixAI Positive Prompt (Tag & Descriptive Hybrid)
```text
(masterpiece, best quality, ultra-detailed:1.2), 1boy, solo, eric brandt, 28 years old rugged handsome male heavy artillery demolition pilot, short dark messy hair, neatly trimmed stubble beard, resolute steel-grey eyes, confident fearless grin, muscular stocky build,
heavy demolition sci-fi pilot combat armor, crimson red and gunmetal black thermal-resistant plating, glowing orange-red heat-sink vents across chest, heavy blast-shield collar, tactical ammo harness with glowing thermal energy cells, reinforced hydraulic combat gauntlets,
inspired by starfront heavy siege weaponry and vanguard reinforced engineering, glowing embers and fiery plasma sparks atmosphere, clean professional anime linework, rich cel shading, cinematic dramatic warm lighting, industrial hangar background, high-end anime concept art
```

#### D. PixAI Negative Prompt
```text
(worst quality, low quality:1.4), (deformed, distorted, disfigured:1.3), female, girl, pixel art, retro sprite, 8-bit, 16-bit, blocky, chunky, voxel, 3d render, flat vector, svg, chibi, weak build, clean shaven boy, blurry, bad anatomy, bad hands, extra digits, cropped, text, signature, watermark
```

#### E. Thiết Lập Đề Xuất PixAI
- **Model**: Animagine XL V3.1 hoặc Moonbeam
- **Aspect Ratio**: 1:1 (1024×1024) cho Portrait / 9:16 (896×1600) cho Full-body
- **Steps**: 30 | **CFG**: 7.0 | **Sampler**: DPM++ 2M Karras

#### F. Cầu Nối Thẩm Mỹ Với GEAR
- Kế thừa sự đầm chắc, các khe thông gió tản nhiệt chịu nhiệt cực hạn và công nghệ bọc giáp titan của dòng chiến hạm Vanguard hạng nặng với sắc đỏ nhiệt hạch (`#ef4444`).

---

### PILOT 05: Lyra Vance — VALKYRIE

#### A. Hồ Sơ Nhân Vật & Vai Trò Chiến Thuật
- **Họ Tên**: Lyra Vance *(dữ liệu gốc: Lyra Song / Vance)*
- **Callsign**: VALKYRIE
- **Giới Tính / Tuổi**: Nữ (Female) · 24 tuổi
- **Vai Trò & Chuyên Môn**: Đấu Sĩ Plasma Siêu Thanh / Sát Thủ Bạo Kích (Supersonic Plasma Duelist / Critical Striker)
- **Cơ Giáp Tham Chiếu (Signature GEAR)**: **Falcon Gear** (`falcon-gear.jpg`)
- **Bảng Màu Chủ Đạo**: Tím hoa cà sáng (`#c084fc`), Hồng cánh sen neon (`#e879f9`), Xanh tím thẫm (`#1e1b4b`)
- **Tính Cách & Khí Chất**: Hoạt bát, tinh nghịch, đam mê tốc độ và nhào lộn nghệ thuật; quán quân đấu trường không chiến tự do Vành Đai Sao Băng.
- **Trích Dẫn Biểu Tượng**: *"Chiến trường là sân khấu của tôi, và nhát chém plasma này là hồi kết dành cho bạn!"*

#### B. Bản Thiết Kế Tạo Hình Chi Tiết (Visual Concept)
- **Khuôn Mặt & Ánh Mắt**: Xinh đẹp, rạng rỡ và sắc sảo; đôi mắt màu thạch anh tím (amethyst) lấp lánh ánh cười thách thức; làn da trắng sáng; vẻ đẹp anime hiện đại tràn đầy năng lượng.
- **Mái Tóc**: Mái tóc bạch kim ánh tím buộc hai bên (twin-tails) bồng bềnh chuyển sắc gradient tím hồng rực rỡ ở đuôi tóc, bay nhẹ theo quán tính chuyển động.
- **Trang Phục & Giáp**: Bộ đồ phi công váy ngắn thể thao khí động học công nghệ cao ôm dáng; áo khoác lửng sci-fi phối viền neon hồng tím; cánh tản nhiệt mini hình cánh én sau vai; đôi bốt cao đùi phản lực chống trọng lực.
- **Trang Bị Kèm Theo**: Thanh kiếm lưỡi chém plasma phát sáng ánh tím hồng rực rỡ trên tay; bộ điều khiển năng lượng vòng tay quang học.
- **Ánh Sáng & Bối Cảnh**: Các dải sáng plasma tím uốn lượn hình đôi cánh Valkyrie bao bọc lấy cơ thể; ánh sáng lấp lánh từ bụi sao tinh vân.

#### C. PixAI Positive Prompt (Tag & Descriptive Hybrid)
```text
(masterpiece, best quality, ultra-detailed:1.2), 1girl, solo, lyra vance, 24 years old energetic gorgeous female anime fighter pilot, voluminous platinum hair with glowing violet-pink tips in dynamic twin tails, sparkling amethyst purple eyes, playful confident smile, athletic slender curves,
futuristic acrobatic pilot suit, sporty high-tech pleated miniskirt, midnight indigo and lavender nanofiber bodysuit, glowing magenta and bright purple neon circuit trims, lightweight energy-winged shoulder stabilizers, thigh-high anti-gravity jet boots, holding an elegant glowing purple plasma energy blade,
inspired by starfront falcon agile interceptor aesthetic, nebula valkyrie wings light trail, floating plasma embers, crisp clean anime line art, vibrant cel shading with smooth highlights, dynamic action stance, high-energy cinematic lighting, official anime rpg character artwork
```

#### D. PixAI Negative Prompt
```text
(worst quality, low quality:1.4), (deformed, distorted, disfigured:1.3), pixel art, retro sprite, 8-bit, 16-bit, blocky, chunky, voxel, 3d render, flat vector, svg, masculine, gloomy, clumsy, bad anatomy, bad hands, extra digits, missing limbs, cropped, watermark, text, signature, logo
```

#### E. Thiết Lập Đề Xuất PixAI
- **Model**: Whimsical hoặc Animagine XL V3.1
- **Aspect Ratio**: 1:1 (1024×1024) cho Portrait / 9:16 (896×1600) cho Full-body
- **Steps**: 32 | **CFG**: 7.0 | **Sampler**: DPM++ SDE Karras

#### F. Cầu Nối Thẩm Mỹ Với GEAR
- Kế thừa hình thái cánh lướt và tốc độ Mach của **Falcon Gear**, hiện đại hóa thành đôi cánh năng lượng ánh sáng tím hồng (`#c084fc` / `#e879f9`) phản ánh kỹ năng "Điệu Vũ Valkyrie".

---

### PILOT 06: Kaelen Voss — CIPHER

#### A. Hồ Sơ Nhân Vật & Vai Trò Chiến Thuật
- **Họ Tên**: Kaelen Voss *(dữ liệu gốc: Kaelen Quinn / Voss)*
- **Callsign**: CIPHER *(biệt danh phụ: WRAITH)*
- **Giới Tính / Tuổi**: Nữ (Female) · 25 tuổi
- **Vai Trò & Chuyên Môn**: Chuyên Viên Tác Chiến Điện Tử & Ám Sát Lượng Tử (Quantum Infiltrator / Cyberwarfare Specialist)
- **Cơ Giáp Tham Chiếu (Signature GEAR)**: **Falcon / Stealth Infiltrator Gear** (`falcon-gear.jpg`)
- **Bảng Màu Chủ Đạo**: Xanh mòng két teal (`#14b8a6`), Lục bảo lượng tử (`#2dd4bf`), Đen bóng đêm vô ảnh (`#042f2e` / `#090d16`)
- **Tính Cách & Khí Chất**: Lạnh lùng, bí ẩn, kiệm lời, bộ óc giải mã lượng tử thiên tài từng phục vụ trong cơ quan tình báo vũ trụ ngầm; biến mọi trận địa thành vùng mù radar.
- **Trích Dẫn Biểu Tượng**: *"Kẻ thù nguy hiểm nhất là kẻ mà radar của bạn không bao giờ nhìn thấy."*

#### B. Bản Thiết Kế Tạo Hình Chi Tiết (Visual Concept)
- **Khuôn Mặt & Ánh Mắt**: Vẻ đẹp sắc sảo, lạnh lùng kiểu kuudere; đôi mắt màu xanh ngọc bích phát sáng vi mô với đồng tử hiển thị lưới tọa độ kỹ thuật số; nét mặt điềm tĩnh không dao động.
- **Mái Tóc**: Tóc bob ngắn bất đối xứng (asymmetrical bob) màu xanh đen thẫm, lọn tóc dài rủ nhẹ che một phần gò má.
- **Trang Phục & Giáp**: Bộ đồ tàng hình lượng tử ôm sát phối hợp váy xếp ly công nghệ cao dệt từ sợi quang học hấp thụ sóng radar; mảng vi mạch tản nhiệt xanh teal chạy dọc sườn; bốt tàng hình từ tính không tạo tiếng ồn.
- **Trang Bị Kèm Theo**: Găng tay hack lượng tử hiển thị giao diện bàn phím holographic xanh lục bảo xung quanh ngón tay; súng lục xung điện từ vi mô (EMP) đeo kín đáo bên hông.
- **Ánh Sáng & Bối Cảnh**: Sương mù vi ba lượng tử và các dải mã nhị phân/dữ liệu số bán trong suốt trôi nổi; ánh sáng huyền ảo sắc lạnh.

#### C. PixAI Positive Prompt (Tag & Descriptive Hybrid)
```text
(masterpiece, best quality, ultra-detailed:1.2), 1girl, solo, kaelen voss, 25 years old mysterious beautiful female cyberwarfare pilot, sleek asymmetrical dark teal-black bob haircut, sharp piercing luminous jade-teal eyes with subtle digital HUD reticle reflection, calm aloof kuudere expression, elegant slender figure,
quantum stealth pilot suit, high-tech active-camouflage pleated techwear miniskirt, midnight black and deep teal matte composite fabrics, glowing holographic cyan-teal data conduits, cybernetic hacking gauntlet with floating green holographic decryption interfaces, silent magnetic boots,
inspired by starfront stealth reconnaissance aesthetic, quantum mirage glitching digital haze particles, crisp clean anime line art, sophisticated cel shading, moody cool cinematic lighting, holographic data streams background, official anime concept art
```

#### D. PixAI Negative Prompt
```text
(worst quality, low quality:1.4), (deformed, distorted, disfigured:1.3), pixel art, retro sprite, 8-bit, 16-bit, blocky, chunky, voxel, 3d render, flat vector, svg, overly bright, noisy clutter, bad anatomy, bad hands, extra digits, missing fingers, cropped, watermark, text, signature, logo
```

#### E. Thiết Lập Đề Xuất PixAI
- **Model**: Neverland hoặc Moonbeam
- **Aspect Ratio**: 1:1 (1024×1024) cho Portrait / 9:16 (896×1600) cho Full-body
- **Steps**: 30 | **CFG**: 7.0 | **Sampler**: DPM++ 2M Karras

#### F. Cầu Nối Thẩm Mỹ Với GEAR
- Kế thừa tính năng né tránh và tàng hình của khung thân Falcon, tái hiện qua cấu trúc sợi quang nano hấp thụ sóng và ánh sáng xanh mòng két (`#14b8a6`) của kỹ năng Nhiễu Loạn Lượng Tử.

---

### PILOT 07: Selena Cross — SOLARIS

#### A. Hồ Sơ Nhân Vật & Vai Trò Chiến Thuật
- **Họ Tên**: Selena Cross *(dữ liệu gốc: Selena Vega / Cross)*
- **Callsign**: SOLARIS
- **Giới Tính / Tuổi**: Nữ (Female) · 27 tuổi
- **Vai Trò & Chuyên Môn**: Chuyên Gia Hỏa Lực Quang Năng / Sĩ Quan Chỉ Huy (Beam Specialist / High-Energy Optics Fleet Officer)
- **Cơ Giáp Tham Chiếu (Signature GEAR)**: **Vanguard / Solar Heavy Gear** (`vanguard-gear.jpg`)
- **Bảng Màu Chủ Đạo**: Cam thái dương (`#ea580c`), Vàng hoàng gia (`#fbbf24`), Đỏ thẫm vương giả (`#431407`)
- **Tính Cách & Khí Chất**: Kiêu sa, quyền quý, thần thái nữ vương chỉ huy; xuất thân từ gia tộc sĩ quan danh tiếng, bậc thầy về hội tụ chùm photon mặt trời nung chảy phòng tuyến địch.
- **Trích Dẫn Biểu Tượng**: *"Dưới ánh sáng thái dương của tôi, bóng tối của các người sẽ bị thiêu rụi hoàn toàn."*

#### B. Bản Thiết Kế Tạo Hình Chi Tiết (Visual Concept)
- **Khuôn Mặt & Ánh Mắt**: Tuyệt sắc giai nhân với khí chất quyền lực uy nghi; đôi mắt phượng màu hổ phách vàng rực như mặt trời; bờ môi gợi cảm tự tin; ánh nhìn kiêu hãnh của bậc chỉ huy tối cao.
- **Mái Tóc**: Mái tóc đỏ rực bồng bềnh uốn lượn như ngọn lửa thái dương, buông xõa dài qua lưng với những vệt highlight vàng óng ả.
- **Trang Phục & Giáp**: Bộ lễ phục sĩ quan phi công váy ngắn sang trọng màu đỏ thẫm viền chỉ vàng kim vương giả; cầu vai quân hàm sĩ quan đính biểu tượng mặt trời; áo choàng chỉ huy lửng tháo rời bay nhẹ trong gió; bốt da sĩ quan cao gót bọc giáp vàng.
- **Trang Bị Kèm Theo**: Thước ngắm tiêu cự quang học cầm tay hoặc quyền trượng điều khiển chùm tia photon mặt trời; các lăng kính hội tụ hạt ánh sáng lơ lửng.
- **Ánh Sáng & Bối Cảnh**: Ánh hào quang mặt trời rực rỡ (solar flare bloom), quầng sáng và tia nắng vàng cam ấm áp phản chiếu lộng lẫy lên trang phục.

#### C. PixAI Positive Prompt (Tag & Descriptive Hybrid)
```text
(masterpiece, best quality, ultra-detailed:1.2), 1girl, solo, selena cross, 27 years old gorgeous regal female fleet officer and solar beam ace pilot, voluminous flowing fiery crimson-red hair with golden sunlight highlights, commanding sharp amber-gold eyes, aristocratic haughty smirk, magnificent statuesque feminine figure,
luxurious futuristic military officer uniform, royal crimson and gold trimmed pilot dress with pleated miniskirt, gold epaulets with solar insignia, detachable officer half-cape flowing in solar wind, gold-plated armor pauldrons, sleek armored officer boots, floating solar photon focus lenses around hand,
inspired by starfront vanguard heavy beam weapon aesthetic, intense solar flare aura, golden sunlight lens flare, crisp clean anime line art, rich saturated cel shading, breathtaking cinematic high-contrast lighting, grand space fleet command bridge background, official anime key art
```

#### D. PixAI Negative Prompt
```text
(worst quality, low quality:1.4), (deformed, distorted, disfigured:1.3), pixel art, retro sprite, 8-bit, 16-bit, blocky, chunky, voxel, 3d render, flat vector, svg, pale washed out colors, timid expression, bad anatomy, bad hands, extra digits, missing fingers, cropped, watermark, text, signature, logo
```

#### E. Thiết Lập Đề Xuất PixAI
- **Model**: Whimsical hoặc Moonbeam (cho màu sắc rực rỡ và ánh sáng chói chang)
- **Aspect Ratio**: 1:1 (1024×1024) cho Portrait / 9:16 (896×1600) cho Full-body
- **Steps**: 32 | **CFG**: 7.5 | **Sampler**: DPM++ 2M Karras

#### F. Cầu Nối Thẩm Mỹ Với GEAR
- Kế thừa đại pháo quang năng hạng nặng của dòng Vanguard, kết hợp cùng năng lượng thái dương rực lửa (`#ea580c` / `#fbbf24`) của kỹ năng Thái Dương Bừng Sáng.

---

### PILOT 08: Victor Stone — BASTION

#### A. Hồ Sơ Nhân Vật & Vai Trò Chiến Thuật
- **Họ Tên**: Victor Stone *(dữ liệu gốc: Victor Sterling / Stone)*
- **Callsign**: BASTION *(biệt danh phụ: TITAN GAUSS)*
- **Giới Tính / Tuổi**: Nam (Male) · 34 tuổi
- **Vai Trò & Chuyên Môn**: Pháo Đài Thép / Chống Chịu Tối Thượng (Heavy Bastion / Fortress Wall Specialist)
- **Cơ Giáp Tham Chiếu (Signature GEAR)**: **Aegis Gear** (`aegis-gear.jpg`)
- **Bảng Màu Chủ Đạo**: Vàng đồng titan (`#d97706`), Vàng hổ phách công nghiệp (`#fbbf24`), Xám đen kim loại nặng (`#292524`)
- **Tính Cách & Khí Chất**: Vững chãi như bàn thạch, giàu lòng hy sinh và bảo bọc; cựu binh 15 năm cống hiến bảo vệ đồng đội, là biểu tượng tinh thần thép của hạm đội.
- **Trích Dẫn Biểu Tượng**: *"Chừng nào tôi còn đứng vững, phòng tuyến này sẽ không bao giờ sụp đổ."*

#### B. Bản Thiết Kế Tạo Hình Chi Tiết (Visual Concept)
- **Khuôn Mặt & Ánh Mắt**: Gương mặt từng trải dạn dày sương gió, xương hàm vuông vức kiên cố; mắt phải màu hổ phách ấm áp, mắt trái tích hợp cảm biến kính ngắm điều biến trọng lực phát sáng xanh băng; vẻ mặt điềm đạm, vững tâm.
- **Mái Tóc**: Tóc húi cua quân đội cắt ngắn màu hoa râm (xám tro pha đen).
- **Trang Phục & Giáp**: Ngoại giáp thủy lực hạng nặng (heavy hydraulic exosuit) bằng hợp kim titan vàng đồng đồ sộ; các thanh giảm chấn cơ học ở bắp tay và đùi; giáp ngực hình khiên kiên cố; găng tay trợ lực khổng lồ.
- **Trang Bị Kèm Theo**: Khiên phản chấn từ trường titan gấp gọn gắn trên cẳng tay; đai thắt lưng neo trọng lực cố định buồng lái.
- **Ánh Sáng & Bối Cảnh**: Khói bụi chiến trường mờ ảo; ánh đèn vàng hổ phách công nghiệp chiếu rọi qua khung giáp kiên cố, tạo nên bóng đổ uy nghi sừng sững như một ngọn núi.

#### C. PixAI Positive Prompt (Tag & Descriptive Hybrid)
```text
(masterpiece, best quality, ultra-detailed:1.2), 1boy, solo, victor stone, 34 years old veteran heavy armored male space pilot, short grizzled salt-and-pepper buzzcut hair, rugged square jawline, weathered calm handsome face, one determined eye and one glowing ice-blue cybernetic ocular sensor, colossal muscular broad-shouldered build,
massive hydraulic titan exosuit armor, heavy bronze-gold and dark industrial iron plating, reinforced shock-absorbing pistons on arms, heavy blast-shield chestplate, colossal armored power gauntlets, integrated forearm magnetic barrier shield, heavy duty magnetic greaves,
inspired by starfront aegis fortress impenetrable armor aesthetic, fortress bastion stance, industrial atmospheric smoke, crisp clean anime line art, heavy defined cel shading, dramatic low-angle cinematic lighting, damaged fortification background, official anime concept illustration
```

#### D. PixAI Negative Prompt
```text
(worst quality, low quality:1.4), (deformed, distorted, disfigured:1.3), female, girl, pixel art, retro sprite, 8-bit, 16-bit, blocky, chunky, voxel, 3d render, flat vector, svg, thin fragile build, youthful boy, clumsy, bad anatomy, bad hands, extra digits, missing fingers, cropped, watermark, signature, text, logo
```

#### E. Thiết Lập Đề Xuất PixAI
- **Model**: Moonbeam hoặc Animagine XL V3.1
- **Aspect Ratio**: 1:1 (1024×1024) cho Portrait / 9:16 (896×1600) cho Full-body
- **Steps**: 32 | **CFG**: 7.0 | **Sampler**: DPM++ 2M Karras

#### F. Cầu Nối Thẩm Mỹ Với GEAR
- Kế thừa trực tiếp lớp giáp titan dày cộp và hệ thống khiên từ trường của **Aegis Gear**, nhân cách hóa thành một chiến binh thép sừng sững không thể bị lay chuyển với ánh vàng đồng (`#d97706`).

---

## 3. Bảng Ma Trận So Sánh 8 Phi Công (Pilot Character Matrix)

Bảng tổng hợp nhanh phục vụ kiểm định tính cân bằng, bản sắc và định hướng hình ảnh:

| STT | Phi Công & Callsign | Giới Tính | Tuổi | Vai Trò Tác Chiến | Cơ Giáp Kế Thừa | Màu Chủ Đạo | Điểm Nhấn Hình Ảnh Đặc Trưng |
|:---:|---|:---:|:---:|---|---|:---:|---|
| **01** | **Marcus Thorne**<br>*WAR DOG* | Nam | 30 | Tiên phong & Đại pháo | **Vanguard** | Cyan (`#06b6d4`) | Exo-suit titan, sẹo chiến binh, mắt hổ phách, đèn vi mạch cyan |
| **02** | **Valentine Vance**<br>*AEGIS ANGEL* | Nữ | 22 | Cứu hộ & Khiên nano | **Aegis** | Vàng & Ngọc bích (`#f59e0b` / `#10b981`) | Tóc vàng bạch kim, váy ngắn nano trắng vàng, khiên lục giác |
| **03** | **Alviss Drake**<br>*GHOSTFIRE* | Nam | 26 | Tiêm kích siêu thanh | **Falcon** | Tím neon (`#a855f7`) | Tóc đen vệt tím, mắt hổ phách, HUD monocle, tàn ảnh Mach |
| **04** | **Eric Brandt**<br>*BUNKER BREAKER* | Nam | 28 | Pháo kích xuyên giáp | **Vanguard** | Đỏ thẫm (`#ef4444`) | Râu quai nón, giáp chống nhiệt đỏ đen, khe tản nhiệt cam |
| **05** | **Lyra Vance**<br>*VALKYRIE* | Nữ | 24 | Kiếm sĩ bạo kích | **Falcon** | Tím hồng (`#c084fc` / `#e879f9`) | Tóc hai bên tím hồng, kiếm plasma, váy thể thao, cánh năng lượng |
| **06** | **Kaelen Voss**<br>*CIPHER* | Nữ | 25 | Tác chiến điện tử | **Falcon** | Xanh teal (`#14b8a6`) | Tóc bob bất đối xứng, mắt ngọc bích, giao diện hack HUD, tàng hình |
| **07** | **Selena Cross**<br>*SOLARIS* | Nữ | 27 | Chùm tia quang học | **Vanguard** | Cam thái dương (`#ea580c`) | Tóc đỏ lửa bồng bềnh, lễ phục sĩ quan hoàng gia, hào quang nắng |
| **08** | **Victor Stone**<br>*BASTION* | Nam | 34 | Pháo đài thép titan | **Aegis** | Vàng đồng (`#d97706`) | Tóc húi cua muối tiêu, ngoại giáp thủy lực khổng lồ, khiên tay titan |

---

## 4. Hướng Dẫn Tải Lại Ảnh Vào STARFRONT Sau Khi Render Trên PixAI

Sau khi hoàn tất sinh ảnh trên PixAI và lựa chọn tác phẩm ưng ý nhất cho từng phi công:
1. **Lưu định dạng PNG chuẩn**:
   - Ảnh Chân Dung (Portrait): Lưu thành file `1024 × 1024` PNG với tên `{pilotId}-portrait.png`.
   - Ảnh Toàn Thân (Full-body): Lưu thành file `900 × 1600` PNG với tên `{pilotId}-fullbody.png`.
2. **Sao chép vào thư mục tài nguyên của dự án**:
   - Đường dẫn đích: `/public/images/{pilotId}-portrait.png` và `/public/images/{pilotId}-fullbody.png`.
3. **Kiểm tra trên giao diện**:
   - Truy cập tab **Pilot Art Gallery** (`components/game/pilot-gallery.tsx`) hoặc buồng lái **Character & Gear** (`components/game/character-gear-select.tsx`) để chiêm ngưỡng tác phẩm hiển thị trực tiếp trong game.

---
*Tài liệu này được biên soạn chuẩn xác 100% dựa trên dữ liệu lore và hệ thống mỹ thuật gốc của dự án STARFRONT.*
