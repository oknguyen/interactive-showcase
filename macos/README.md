# macOS Web — Demo clone macOS chạy 100% trong browser

Clone giao diện macOS (Sequoia) bằng **vanilla HTML/CSS/JS** — không framework, không build step, không asset ngoài (toàn bộ icon và wallpaper là SVG vẽ tay inline).

## Chạy

Mở thẳng `index.html` bằng Chrome/Edge (double-click là chạy), hoặc serve qua HTTP:

```
python -m http.server 8731
# rồi mở http://localhost:8731
```

## Tính năng

### System chrome
- **Menu bar**: Apple menu (About This Mac, Lock Screen, Restart, Shut Down…), menu đổi theo app đang focus, dropdown hover-switch như thật, đồng hồ live, Control Center (toggle Dark Mode, slider Brightness chỉnh độ tối màn hình thật).
- **Dock**: magnification phóng to theo khoảng cách con trỏ (cosine falloff), bounce khi mở app, chấm indicator app đang chạy, tooltip tên app, Launchpad overlay.
- **Window manager**: kéo thả bằng titlebar, resize 8 hướng, traffic lights (đỏ đóng / vàng minimize bay về dock / xanh zoom), double-click titlebar để zoom, focus z-order, dim khi mất focus.
- **Khác**: notification banner kiểu macOS, lock screen, màn hình shutdown, context menu chuột phải trên desktop, light/dark theme.

### 4 app hoạt động thật
| App | Hoạt động |
|---|---|
| **Calculator** | Tính toán đầy đủ (`7×8=56`, `0.1+0.2=0.3`, chia 0 ra Error), hỗ trợ bàn phím, format dấu phẩy hàng nghìn |
| **Notes** | Sidebar + editor, auto-save vào `localStorage` (reload không mất), tạo/xóa/tìm kiếm note |
| **Terminal** | zsh giả lập: `help`, `ls`, `cd`, `cat`, `pwd`, `echo`, `open <app>`, `neofetch`, `wallpaper`, history bằng phím mũi tên, fake filesystem |
| **System Settings** | Đổi wallpaper (6 cái, persist), Appearance Light/Dark, accent color |

## Cấu trúc

```
index.html
css/system.css      # desktop, menubar, dock, windows, overlays
css/apps.css        # style của 4 app
js/core.js          # namespace, app registry, localStorage helper, notify
js/icons.js         # SVG icons vẽ tay (Finder, Safari, Notes…)
js/wallpapers.js    # wallpaper = SVG data URI
js/wm.js            # window manager (drag/resize/minimize/zoom/focus)
js/menubar.js       # menu bar + control center + lock/shutdown
js/dock.js          # dock magnification + launchpad
js/apps/*.js        # calculator, notes, terminal, settings
```

Persistence dùng `localStorage` theo origin — wallpaper, theme, accent và notes đều giữ qua reload.

Made by OkNguyen 🍎
