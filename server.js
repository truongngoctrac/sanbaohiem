// server.js (Hoặc authRoutes.js)
// Giả sử bạn đã cài đặt express và bcrypt: npm install express bcrypt

const express = require("express");
const bcrypt = require("bcrypt");
const app = express();
const port = 3000;

// Middleware để parse JSON request body
app.use(express.json());

// --- Mô Phỏng Cơ Sở Dữ Liệu ---
// Trong thực tế, bạn sẽ sử dụng một hệ quản trị CSDL như PostgreSQL, MongoDB,...
// và một ORM/ODM như Sequelize, Mongoose.
const db = {
  users: [], // Lưu trữ thông tin chung của người dùng
  individualUserDetails: [], // Chi tiết người dùng cá nhân
  businessUserDetails: [], // Chi tiết người dùng doanh nghiệp
};

// --- Helper Functions ---
// Hàm tạo ID duy nhất (đơn giản cho ví dụ)
const generateId = () => Math.random().toString(36).substr(2, 9);

// Hàm băm mật khẩu
const hashPassword = async (password) => {
  const saltRounds = 10; // Độ phức tạp của salt
  return await bcrypt.hash(password, saltRounds);
};

// --- API Endpoints ---

/**
 * @route POST /api/auth/register/individual
 * @desc Đăng ký tài khoản cho khách hàng cá nhân
 * @access Public
 */
app.post("/api/auth/register/individual", async (req, res) => {
  try {
    // Lấy dữ liệu từ request body
    const {
      email,
      password,
      fullName,
      dateOfBirth,
      gender,
      nationalId,
      occupation,
      address,
      phoneNumber,
    } = req.body;

    // --- Xác thực dữ liệu đầu vào (Cần làm kỹ hơn trong thực tế) ---
    if (!email || !password || !fullName || !nationalId) {
      return res
        .status(400)
        .json({
          message:
            "Vui lòng cung cấp đầy đủ thông tin bắt buộc: email, mật khẩu, họ tên, và số CMND/CCCD.",
        });
    }

    // Kiểm tra xem email đã tồn tại chưa
    const existingUser = db.users.find((user) => user.email === email);
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Email này đã được sử dụng để đăng ký." });
    }

    // Băm mật khẩu
    const hashedPassword = await hashPassword(password);

    // Tạo người dùng mới
    const newUser = {
      userId: generateId(),
      email: email,
      passwordHash: hashedPassword,
      role: "individual", // Vai trò người dùng
      createdAt: new Date(),
    };
    db.users.push(newUser);

    // Lưu thông tin chi tiết của người dùng cá nhân
    const individualDetails = {
      detailId: generateId(),
      userId: newUser.userId,
      fullName,
      dateOfBirth,
      gender,
      nationalId,
      occupation,
      address,
      phoneNumber,
      // communicationPreferences: {}, // Có thể thêm sau
      // loyaltyStatus: 'bronze',
      // mfaSecret: null,
      // mfaEnabled: false
    };
    db.individualUserDetails.push(individualDetails);

    console.log("Người dùng cá nhân mới đã đăng ký:", newUser);
    console.log("Chi tiết người dùng cá nhân:", individualDetails);

    // Trả về thông báo thành công (Không trả về mật khẩu)
    // Trong thực tế, bạn có thể trả về JWT token để tự động đăng nhập
    res.status(201).json({
      message: "Đăng ký tài khoản cá nhân thành công!",
      userId: newUser.userId,
      email: newUser.email,
    });
  } catch (error) {
    console.error("Lỗi khi đăng ký tài khoản cá nhân:", error);
    res
      .status(500)
      .json({ message: "Đã xảy ra lỗi máy chủ. Vui lòng thử lại sau." });
  }
});

/**
 * @route POST /api/auth/register/business
 * @desc Đăng ký tài khoản cho khách hàng doanh nghiệp
 * @access Public
 */
app.post("/api/auth/register/business", async (req, res) => {
  try {
    const {
      // Thông tin tài khoản quản trị của doanh nghiệp
      adminEmail, // Email của người quản trị tài khoản doanh nghiệp
      adminPassword,
      // Thông tin doanh nghiệp
      companyName,
      taxCode,
      industry,
      registrationNumber,
      companyAddress,
      companyPhone,
      companyEmail, // Email chính thức của công ty (có thể khác adminEmail)
    } = req.body;

    // --- Xác thực dữ liệu đầu vào ---
    if (
      !adminEmail ||
      !adminPassword ||
      !companyName ||
      !taxCode ||
      !companyAddress
    ) {
      return res
        .status(400)
        .json({
          message:
            "Vui lòng cung cấp đầy đủ thông tin bắt buộc: email quản trị, mật khẩu quản trị, tên công ty, mã số thuế, và địa chỉ công ty.",
        });
    }

    // Kiểm tra xem email quản trị đã tồn tại chưa
    const existingUser = db.users.find((user) => user.email === adminEmail);
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Email quản trị này đã được sử dụng." });
    }

    // Băm mật khẩu quản trị
    const hashedPassword = await hashPassword(adminPassword);

    // Tạo tài khoản người dùng quản trị cho doanh nghiệp
    const newAdminUser = {
      userId: generateId(),
      email: adminEmail,
      passwordHash: hashedPassword,
      role: "business_admin", // Vai trò quản trị viên doanh nghiệp
      createdAt: new Date(),
    };
    db.users.push(newAdminUser);

    // Lưu thông tin chi tiết của doanh nghiệp
    // userId ở đây sẽ là userId của người quản trị đầu tiên của doanh nghiệp,
    // hoặc có thể có một businessId riêng nếu nhiều người dùng có thể thuộc cùng một doanh nghiệp.
    // Để đơn giản, ví dụ này gắn business details với admin user đầu tiên.
    const businessDetails = {
      businessDetailId: generateId(),
      // adminUserId: newAdminUser.userId, // Liên kết với người dùng quản trị
      // Hoặc có thể tạo một businessId riêng và liên kết users với businessId đó.
      // Ví dụ này đơn giản hóa bằng cách coi thông tin doanh nghiệp là một phần mở rộng của user quản trị.
      // Trong thực tế, bạn nên có bảng Businesses riêng và bảng UserBusinessRoles.
      userIdAssociated: newAdminUser.userId, // Tạm thời liên kết trực tiếp với user admin
      companyName,
      taxCode,
      industry,
      registrationNumber,
      companyAddress,
      companyPhone,
      companyEmail,
      // tierStatus: 'standard'
    };
    db.businessUserDetails.push(businessDetails); // Lưu vào một collection/table riêng cho business details

    console.log("Tài khoản quản trị doanh nghiệp mới:", newAdminUser);
    console.log("Chi tiết doanh nghiệp:", businessDetails);

    res.status(201).json({
      message: "Đăng ký tài khoản doanh nghiệp thành công!",
      adminUserId: newAdminUser.userId,
      adminEmail: newAdminUser.email,
      companyName: businessDetails.companyName,
    });
  } catch (error) {
    console.error("Lỗi khi đăng ký tài khoản doanh nghiệp:", error);
    res
      .status(500)
      .json({ message: "Đã xảy ra lỗi máy chủ. Vui lòng thử lại sau." });
  }
});

// Khởi động server
app.listen(port, () => {
  console.log(`Server đang chạy tại http://localhost:${port}`);
  console.log("Các endpoints đăng ký:");
  console.log(`  POST http://localhost:${port}/api/auth/register/individual`);
  console.log(`  POST http://localhost:${port}/api/auth/register/business`);
});

/*
--- Cấu trúc dữ liệu (Mô phỏng cho db object) ---

// db.users sẽ có dạng:
[
  {
    userId: 'abc123xyz',
    email: 'user@example.com',
    passwordHash: '$2b$10$abcdefghijklmnopqrstuv', // Hash của mật khẩu
    role: 'individual' | 'business_admin', // hoặc các vai trò khác
    createdAt: DateObject
  }
]

// db.individualUserDetails sẽ có dạng:
[
  {
    detailId: 'def456uvw',
    userId: 'abc123xyz', // Khóa ngoại liên kết với bảng users
    fullName: 'Nguyễn Văn A',
    dateOfBirth: '1990-01-01',
    // ... các trường khác
  }
]

// db.businessUserDetails sẽ có dạng:
[
  {
    businessDetailId: 'ghi789rst',
    userIdAssociated: 'xyz789abc', // userId của người quản trị liên quan
    companyName: 'Công Ty TNHH ABC',
    taxCode: '0123456789',
    // ... các trường khác
  }
]

--- Lưu ý quan trọng trong thực tế ---
1.  **Xác thực dữ liệu (Validation):** Sử dụng các thư viện như Joi, express-validator để xác thực dữ liệu đầu vào một cách chặt chẽ (định dạng email, độ dài mật khẩu, kiểu dữ liệu, các trường bắt buộc, v.v.).
2.  **Xử lý lỗi (Error Handling):** Cần có middleware xử lý lỗi tập trung và trả về các thông báo lỗi rõ ràng, thân thiện với người dùng.
3.  **Bảo mật:**
    * Luôn băm mật khẩu.
    * Sử dụng HTTPS.
    * Cân nhắc các biện pháp bảo vệ chống lại tấn công CSRF, XSS.
    * Tốc độ giới hạn (Rate limiting) cho các API đăng ký để tránh tấn công brute-force hoặc spam.
4.  **Cơ sở dữ liệu thực tế:** Sử dụng ORM (Object-Relational Mapper) như Sequelize (cho SQL) hoặc ODM (Object-Document Mapper) như Mongoose (cho MongoDB) để tương tác với CSDL một cách an toàn và hiệu quả hơn.
5.  **Gửi email xác nhận:** Sau khi đăng ký thành công, nên gửi email xác nhận đến địa chỉ email của người dùng.
6.  **Cấu trúc cho doanh nghiệp:** Đối với đăng ký doanh nghiệp, mô hình dữ liệu có thể phức tạp hơn. Bạn có thể có một bảng `Businesses` riêng và một bảng `UserBusinessRoles` để quản lý mối quan hệ giữa người dùng và doanh nghiệp, cũng như vai trò của họ trong doanh nghiệp đó. Ví dụ trên đã được đơn giản hóa.
7.  **JWT/Session:** Sau khi đăng ký, bạn có thể cân nhắc việc tự động đăng nhập người dùng bằng cách trả về một JSON Web Token (JWT) hoặc tạo một session.
*/
