# Twitter Comment Pack — Trym10M Build

## Cài đặt

```powershell
npm install
npm run setup
npm start
```

## Mode

- `A`: comment theo X/Twitter List ID.
- `B`: comment theo hashtag và dùng tweet mới nhất của owner để amplify.
- `C`: chạy cả A và B.

## Lưu ý bảo mật

Không upload:

- `data/config.json`
- `data/cookies.json`
- `data/run.log`
- `.env`

Các file này đã nằm trong `.gitignore`.
