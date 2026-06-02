# Twitter Comment Pack — Trym10M Build

Bản repo upload sẵn cho `@trym10m`.

Thay đổi chính:

- Warmup / auto-follow target đã đổi sang `@trym10m`.
- Giữ schema config tương thích với bot auto comment cũ: Mode A / B / C, Telegram, DeepSeek/OpenAI/Anthropic.
- Không chứa cookies, API key, log hoặc file nhạy cảm.

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
