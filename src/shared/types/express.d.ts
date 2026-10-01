// Bước E: nói cho TypeScript biết `req.user` tồn tại (declaration merging = "gộp khai báo")
//
// HINT:
// - Express đã khai báo namespace `Express` với interface `Request` rỗng để người dùng mở rộng.
//   Cấu trúc cần viết:
//     declare global {
//       namespace Express {
//         interface Request {
//           user?: { id: string };   // vì sao dấu `?` (optional)? Nhớ exactOptionalPropertyTypes trong tsconfig.
//         }
//       }
//     }
// - File .d.ts phải được coi là "module" thì `declare global` mới hợp lệ: thêm `export {};` ở cuối file.
// - Kiểm tra tsconfig.json "include" có phủ src/shared/types chưa; nếu middleware báo "Property 'user' does not exist"
//   nghĩa là file này chưa được TS nhìn thấy.
declare global {
  namespace Express {
    interface Request {
      user?: { id: string };
    }
  }
}

export {};
