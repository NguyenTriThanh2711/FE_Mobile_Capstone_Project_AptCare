Thanh` use pixel 4d, API 33 , Android 13 ("tiramisu")

# Expo Router Example

Use [`expo-router`](https://docs.expo.dev/router/introduction/) to build native navigation using files in the `app/` directory.

## Launch your own

[![Launch with Expo](https://github.com/expo/examples/blob/master/.gh-assets/launch.svg?raw=true)](https://launch.expo.dev/?github=https://github.com/expo/examples/tree/master/with-router)

## 🚀 How to use

```sh
npx create-expo-app -e with-router
```

## Deploy

Deploy on all platforms with Expo Application Services (EAS).

- Deploy the website: `npx eas-cli deploy` — [Learn more](https://docs.expo.dev/eas/hosting/get-started/)
- Deploy on iOS and Android using: `npx eas-cli build` — [Learn more](https://expo.dev/eas)

## 📝 Notes

- [Expo Router: Docs](https://docs.expo.dev/router/introduction/)

## Directory structure
aptcare-mobile/
├─ app/                                # expo-router: chỉ chứa điều hướng/màn hình
│  ├─ (auth)/
│  │  ├─ _layout.jsx                   # Stack cho auth
│  │  ├─ login.jsx
│  │  └─ register.jsx
│  ├─ (resident)/                      # NAV riêng cho cư dân
│  │  ├─ _layout.jsx                   # Tabs: home/requests/profile
│  │  ├─ home.jsx
│  │  ├─ requests.jsx                  # danh sách yêu cầu
│  │  ├─ request-create.jsx            # tạo yêu cầu
│  │  └─ request/
│  │     └─ [id].jsx                   # chi tiết yêu cầu
│  ├─ (technician)/                    # NAV riêng cho kỹ thuật
│  │  ├─ _layout.jsx                   # Tabs: dashboard/jobs/profile
│  │  ├─ dashboard.jsx
│  │  ├─ jobs.jsx                      # danh sách job
│  │  └─ jobs/
│  │     └─ [id].jsx                   # chi tiết job
│  ├─ role-gateway.jsx                 # chuyển hướng theo role sau đăng nhập
│  ├─ _layout.jsx                      # Root: Redux Provider + Tailwind CSS
│  └─ [...unmatched].jsx                
│
├─ src/                                # code logic & UI tái sử dụng
│  ├─ features/                        # Feature-first (Redux slice, API, selector)
│  │  ├─ auth/
│  │  │  ├─ authSlice.js
│  │  │  ├─ selectors.js
│  │  │  └─ api.js                     # (tuỳ) endpoint auth
│  │  ├─ requests/
│  │  │  ├─ requestsSlice.js
│  │  │  ├─ selectors.js
│  │  │  └─ api.js
│  │  └─ technician/
│  │     ├─ scheduleSlice.js
│  │     └─ api.js
│  ├─ components/                      # UI building blocks (không side-effects)
│  │  ├─ common/
│  │  │  ├─ Button.jsx
│  │  │  ├─ Card.jsx
│  │  │  └─ StatusBadge.jsx
│  │  ├─ request/
│  │  │  └─ RequestCard.jsx
│  │  └─ form/
│  │     ├─ TextField.jsx
│  │     └─ MediaPicker.jsx
│  ├─ services/                        # giao tiếp bên ngoài
│  │  ├─ http.js                       # axios instance + interceptors token
│  │  ├─ storage.js                    # AsyncStorage helpers
│  │  ├─ notifications.js              # Expo push (làm sau)
│  │  └─ realtime.js                   # socket.io client (làm sau)
│  ├─ store/
│  │  ├─ index.js                      # configureStore()
│  │  └─ hooks.js                      # useAppDispatch/useAppSelector
│  ├─ navigation/
│  │  └─ roleConfig.js                 # map role → entry route
│  ├─ utils/                             # utils thuần
│  │  ├─ constants.js
│  │  ├─ date.js
│  │  └─ validation.js
│  └─ theme/
│     └─ tailwind.css                  # NativeWind/Tailwind
|  assets/                              #image
|    fonts/
│    images/
│  .husky/                              #chưa kịp tạo (kiểu như tăng chất lượng commit)
│  .vscode/
│  babel.config.js
│  tailwind.config.js
│  app.config.js                # Expo config
│  .env                         # ENV (EXPO_PUBLIC_*)
│  .eslintrc.js
│  .prettierrc
│  jest.config.js               #chưa kịp setup
│  package.json
│  README.md

