import webbrowser

URLS = [
    "https://shahiracode.in/",
    "https://dashboard.render.com/",
    "https://vercel.com/shaikmaviyas-projects/shahira-code-beta/deployments",
]


def main() -> None:
    for url in URLS:
        webbrowser.open_new_tab(url)


if __name__ == "__main__":
    main()
