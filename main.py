import requests
import os
from kivy.app import App
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.button import Button
from kivy.uix.label import Label
from kivy.uix.textinput import TextInput
from kivy.uix.scrollview import ScrollView

SERVER_URL = "http://localhost:3000"

class MithraApp(App):
    def build(self):
        self.layout = BoxLayout(orientation="vertical", padding=10, spacing=5)

        # ورودی پرامپت
        self.prompt_input = TextInput(
            hint_text="اینجا درخواستت رو بنویس...",
            size_hint=(1, 0.2),
            multiline=True
        )

        # نمایش خروجی
        scroll = ScrollView(size_hint=(1, 0.4))
        self.label = Label(
            text="📲 MithraYmir آماده است",
            size_hint_y=None,
            halign="left",
            valign="top"
        )
        self.label.bind(texture_size=self.update_label_height)
        scroll.add_widget(self.label)

        # دکمه‌ها
        btn_send = Button(text="🚀 ارسال به ChatGPT", size_hint=(1, 0.12))
        btn_send.bind(on_press=self.send_prompt)

        self.btn_test = Button(text="🧪 تست فایل", size_hint=(1, 0.12))
        self.btn_test.bind(on_press=self.test_file)
        self.btn_test.disabled = True

        self.btn_upload = Button(text="✅ تایید و آپلود", size_hint=(1, 0.12))
        self.btn_upload.bind(on_press=self.upload_file)
        self.btn_upload.disabled = True

        btn_list = Button(text="📂 فایل‌های GitHub", size_hint=(1, 0.12))
        btn_list.bind(on_press=self.list_github_files)

        btn_download = Button(text="⬇️ دانلود فایل", size_hint=(1, 0.12))
        btn_download.bind(on_press=self.download_file)

        btn_run = Button(text="▶️ اجرای فایل", size_hint=(1, 0.12))
        btn_run.bind(on_press=self.run_file)

        # چیدن المان‌ها
        self.layout.add_widget(self.prompt_input)
        self.layout.add_widget(btn_send)
        self.layout.add_widget(self.btn_test)
        self.layout.add_widget(self.btn_upload)
        self.layout.add_widget(btn_list)
        self.layout.add_widget(btn_download)
        self.layout.add_widget(btn_run)
        self.layout.add_widget(scroll)

        # متغیرها
        self.generated_file = None
        self.generated_content = None

        return self.layout

    def update_label_height(self, instance, size):
        instance.height = size[1]
        instance.text_size = (instance.width, None)

    # ارسال پرامپت به ChatGPT
    def send_prompt(self, instance):
        prompt = self.prompt_input.text.strip()
        if not prompt:
            return
        try:
            r = requests.post(f"{SERVER_URL}/ask", json={"prompt": prompt})
            if r.status_code == 200:
                answer = r.json().get("response", "")
                filename = "generated.py"
                with open(filename, "w", encoding="utf-8") as f:
                    f.write(answer)
                self.generated_file = filename
                self.generated_content = answer
                self.label.text = f"📂 فایل ساخته شد: {filename}\n\n{answer}"
                self.btn_test.disabled = False
                self.btn_upload.disabled = False
            else:
                self.label.text = "❌ خطا در ChatGPT"
        except Exception as e:
            self.label.text = f"❌ {e}"

    # تست فایل قبل از آپلود
    def test_file(self, instance):
        if not self.generated_file:
            return
        try:
            r = requests.post(f"{SERVER_URL}/test", json={"filename": self.generated_file})
            self.label.text = str(r.json())
        except Exception as e:
            self.label.text = f"❌ {e}"

    # تایید و آپلود به GitHub
    def upload_file(self, instance):
        if not self.generated_file:
            return
        try:
            data = {"filename": self.generated_file, "content": self.generated_content}
            r = requests.post(f"{SERVER_URL}/upload", json=data)
            if r.status_code == 200:
                self.label.text = f"✅ {self.generated_file} روی GitHub آپلود شد"
                self.btn_upload.disabled = True
            else:
                self.label.text = "❌ خطا در آپلود"
        except Exception as e:
            self.label.text = f"❌ {e}"

    # لیست فایل‌های GitHub
    def list_github_files(self, instance):
        try:
            r = requests.get(f"{SERVER_URL}/files")
            if r.status_code == 200:
                files = r.json()
                self.label.text = "📂 فایل‌ها:\n" + "\n".join(files)
            else:
                self.label.text = "❌ خطا در گرفتن لیست"
        except Exception as e:
            self.label.text = f"❌ {e}"

    # دانلود فایل از GitHub
    def download_file(self, instance):
        if not self.generated_file:
            self.label.text = "⚠️ اول باید فایلی بسازی یا اسم فایل رو تغییر بدی"
            return
        try:
            r = requests.get(f"{SERVER_URL}/download/{self.generated_file}")
            self.label.text = str(r.json())
        except Exception as e:
            self.label.text = f"❌ {e}"

    # اجرای فایل
    def run_file(self, instance):
        if not self.generated_file:
            return
        try:
            r = requests.post(f"{SERVER_URL}/run", json={"filename": self.generated_file})
            self.label.text = str(r.json())
        except Exception as e:
            self.label.text = f"❌ {e}"

if __name__ == "__main__":
    MithraApp().run()
