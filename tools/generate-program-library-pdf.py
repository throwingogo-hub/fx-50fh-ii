#!/usr/bin/env python3
"""Build the curated S5 program-library PDF from programs.catalog.json."""

from __future__ import annotations

import json
from pathlib import Path

from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "programs.catalog.json"
OUTPUT = ROOT / "output/pdf/fx-50fh-ii-s5-program-library.pdf"
PAGE_W, PAGE_H = 612, 865.748

BODY_FONT = "ArialUnicode"
BODY_BOLD = "STHeitiMedium"
MONO_FONT = "ArialUnicode"

META = {
    "P1": ("一元二次方程工具", "一次輸入係數，即時計算判別式、頂點及所有實根。", "A=a，B=b，C=c", "判別式、頂點 (h,k)、實根"),
    "P2": ("等差及等比數列", "處理等差、有限等比及無限等比數列的項及和。", "M=類型；A=首項；B=公差/公比；C=n", "指定項及部分和/無限和"),
    "P3": ("坐標幾何及圓", "計算兩點距離、中點、斜率，或由一般式求圓心及半徑。", "M=1 兩點；M=2 圓的一般式係數", "距離、中點、斜率／圓心、半徑"),
    "P4": ("三角方程解", "求 0° 至 360° 內所有 sin、cos 或 tan 方程的解。", "M=1/2/3；D=已分離的三角函數值", "區間內所有不同角度"),
    "A": ("聯立二元一次方程", "輸入兩條直線方程的六個係數，求唯一交點。", "A,B,C 及 D,X,Y 為兩式係數", "x、y"),
    "B": ("三點定圓", "由三個不共線點求圓心、半徑及一般式。", "A,B；C,D；X,Y 為三點坐標", "圓心、半徑、一般式係數"),
    "C": ("增長與衰減", "在複式增長或衰減模型中求終值、時間、率或初值。", "M=未知量類型；其餘輸入已知數值", "所選未知量"),
    "D": ("合併統計數據", "只有兩組人數、平均數及母體標準差時，合併兩組數據。", "A,B,C 及 D,X,Y 為兩組 n, μ, σ", "合併平均數及母體標準差"),
    "E": ("直線與圓的參數 k 交點", "當 k 出現在圓或直線的係數時，代入指定 k 值並求數值交點。", "M=k；圓 A,B,C；直線 D,X,Y；係數可含 M", "一或兩組 (x,y)；切線只輸出一組"),
    "F": ("數列目標項數", "求部分和首次達到指定目標時的最小正整數 n。", "M=AP/GP；A=首項；B=公差/公比；C=目標", "最小 n 及對應 Sₙ"),
    "H": ("一元三次方程完整求根", "毋須先知道因式，直接求一元三次方程的所有不同實根。", "A,B,C,M 為 Ax³+Bx²+Cx+D=0 的係數", "一個、兩個或三個不同實根"),
    "I": ("不放回抽樣概率", "以組合公式計算恰好、至少或至多指定數目的概率。", "M=1/2/3；A,B=兩類數量；C=抽取數；D=目標", "所需概率"),
    "J": ("變換根方程", "不先求原根，直接建立線性變換根或平方根的新二次方程。", "M=模式；A,B,C=原式；模式 1 再輸入 X,Y", "新首一二次方程的 P、Q"),
    "K": ("圓外一點的切線", "由圓心、半徑及圓外點求切線長及兩個切點。", "A,B=圓心；C=半徑；D,X=圓外點", "切線長及兩個切點"),
    "L": ("年金與貸款", "處理期末供款的儲蓄終值、貸款供款及尚欠餘額。", "M=模式；A=本金；B=每期利率%；C=期數；D=供款", "所選金融數值"),
    "M": ("任意三角形四心", "輸入任意三個不共線頂點，求形心、內心、垂心及外心。", "REG 模式；A,B；C,D；X,Y 為三點坐標", "G、I、H、O 四組坐標"),
}


def register_fonts() -> None:
    pdfmetrics.registerFont(TTFont(BODY_FONT, "/System/Library/Fonts/Supplemental/Arial Unicode.ttf"))
    pdfmetrics.registerFont(TTFont(BODY_BOLD, "/System/Library/Fonts/STHeiti Medium.ttc", subfontIndex=0))


def wrap(text: str, font: str, size: float, width: float) -> list[str]:
    lines: list[str] = []
    for paragraph in text.split("\n"):
        if not paragraph:
            lines.append("")
            continue
        current = ""
        for char in paragraph:
            trial = current + char
            if current and pdfmetrics.stringWidth(trial, font, size) > width:
                lines.append(current.rstrip())
                current = char.lstrip() if char.isspace() else char
            else:
                current = trial
        if current:
            lines.append(current.rstrip())
    return lines


def draw_lines(c: canvas.Canvas, lines: list[str], x: float, y: float, font: str, size: float,
               leading: float | None = None, max_lines: int | None = None) -> float:
    leading = leading or size * 1.35
    use = lines[:max_lines] if max_lines else lines
    c.setFont(font, size)
    for line in use:
        c.drawString(x, y, line)
        y -= leading
    return y


def footer(c: canvas.Canvas, page_no: int) -> None:
    c.setStrokeColor(colors.HexColor("#C9C9C9"))
    c.line(42, 31, PAGE_W - 42, 31)
    c.setFillColor(colors.HexColor("#444444"))
    c.setFont(BODY_FONT, 7.5)
    c.drawString(42, 18, "fx-50FH II · Curated S5 Program Library · throwingogo-hub.github.io/fx-50fh-ii/")
    c.drawRightString(PAGE_W - 42, 18, str(page_no))


def calculator_mark(c: canvas.Canvas, x: float, y: float, w: float, h: float) -> None:
    c.setLineWidth(2.5)
    c.roundRect(x, y, w, h, 18, stroke=1, fill=0)
    c.roundRect(x + 14, y + h - 58, w - 28, 38, 5, stroke=1, fill=0)
    c.setFont("Helvetica-Bold", 14)
    c.drawCentredString(x + w / 2, y + h - 45, "PROGRAM")
    key_w = (w - 40) / 5
    key_h = 19
    for row in range(7):
        for col in range(5):
            kx = x + 12 + col * (key_w + 4)
            ky = y + 13 + row * (key_h + 5)
            c.roundRect(kx, ky, key_w, key_h, 3, stroke=1, fill=0)


def cover_page(c: canvas.Canvas, programs: list[dict]) -> None:
    c.setFillColor(colors.black)
    c.setFont("Helvetica-Bold", 43)
    c.drawCentredString(PAGE_W / 2, PAGE_H - 72, "CASIO fx-50FH II")
    calculator_mark(c, PAGE_W / 2 - 64, PAGE_H - 300, 128, 194)
    c.setFont("Helvetica-Bold", 25)
    c.drawCentredString(PAGE_W / 2, PAGE_H - 340, "S5 PROGRAM LIBRARY")
    c.setFont(BODY_BOLD, 20)
    c.drawCentredString(PAGE_W / 2, PAGE_H - 370, "中五計算機程式 · 精選版")
    c.setFont(BODY_FONT, 9.5)
    c.drawCentredString(PAGE_W / 2, PAGE_H - 393, "16 tested programs · 7 memory-safe packs · 680-byte aware")

    start_y = PAGE_H - 432
    col_w = 255
    for i, program in enumerate(programs):
        col = i // 8
        row = i % 8
        x = 52 + col * col_w
        y = start_y - row * 39
        zh = META[program["id"]][0]
        c.setFont("Helvetica-Bold", 10.5)
        c.drawString(x, y, f"Program {i + 1:02d}")
        c.setFont(BODY_BOLD, 9.5)
        c.drawString(x + 72, y, zh)
        c.setFont(BODY_FONT, 7.6)
        c.setFillColor(colors.HexColor("#555555"))
        c.drawString(x + 72, y - 13, program["title"])
        c.setFillColor(colors.black)
    c.setFont(BODY_FONT, 8)
    c.drawCentredString(PAGE_W / 2, 47, "Built from the canonical tested web catalog · Revised 13 August 2026")
    c.showPage()


def reference_page(c: canvas.Canvas, page_no: int) -> None:
    c.setFont("Helvetica-Bold", 25)
    c.drawString(44, PAGE_H - 54, "PRGM Command Reference")
    c.setFont(BODY_BOLD, 15)
    c.drawString(44, PAGE_H - 78, "程式模式按鍵速查")
    entries = [
        ("?", "SHIFT 3 1", "ClrMemory", "SHIFT 9 1"),
        (": / new line", "SHIFT 3 3 or EXE", "ClrStat", "SHIFT 9 1"),
        ("◢ output", "SHIFT 3 4", "Goto", "SHIFT 3 ▶ ▶ ▶ 1"),
        ("→ assign", "SHIFT 3 2", "Lbl", "SHIFT 3 ▶ ▶ ▶ 2"),
        ("⇒", "SHIFT 3 ▶ 1", "If", "SHIFT 3 ◀ 1"),
        ("=", "SHIFT 3 ▶ 2", "Then", "SHIFT 3 ◀ 2"),
        ("≠", "SHIFT 3 ▶ 3", "Else", "SHIFT 3 ◀ ◀ 1"),
        ("> / <", "SHIFT 3 ▶ ▶ 1 / 2", "IfEnd", "SHIFT 3 ◀ ◀ 1"),
        ("≥ / ≤", "SHIFT 3 ▶ ▶ 3 / 4", "While", "SHIFT 3 ▶ ▶ ▶ 1"),
        ("A B C D", "ALPHA + letter key", "WhileEnd", "SHIFT 3 ▶ ▶ ▶ 2"),
        ("X Y M", "ALPHA + ) , M+", "For / To / Step", "SHIFT 3 ◀ ◀ ◀ 1/2/3"),
        ("Rnd(", "SHIFT 0", "Next", "SHIFT 3 ◀ ◀ ◀ ◀ 1"),
        ("Fix / Sci / Norm", "SHIFT MODE ▶ 1/2/3", "Abs(", "SHIFT )"),
        ("Pol( / Rec(", "SHIFT + / SHIFT -", "DT", "M+ in SD/REG"),
    ]
    x0, y0 = 44, PAGE_H - 112
    widths = [112, 138, 108, 166]
    row_h = 43
    headers = ["Command", "Physical keys", "Command", "Physical keys"]
    c.setFillColor(colors.HexColor("#111111"))
    c.rect(x0, y0 - 29, sum(widths), 29, stroke=0, fill=1)
    pos = x0
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 9)
    for header, width in zip(headers, widths):
        c.drawCentredString(pos + width / 2, y0 - 18, header)
        pos += width
    c.setFillColor(colors.black)
    y = y0 - 29
    for r, entry in enumerate(entries):
        if r % 2 == 0:
            c.setFillColor(colors.HexColor("#F1F1F1"))
            c.rect(x0, y - row_h, sum(widths), row_h, stroke=0, fill=1)
        c.setFillColor(colors.black)
        pos = x0
        for text, width in zip(entry, widths):
            c.rect(pos, y - row_h, width, row_h, stroke=1, fill=0)
            lines = wrap(text, BODY_FONT, 8.2, width - 10)
            draw_lines(c, lines, pos + 5, y - 15, BODY_FONT, 8.2, 10.5, 2)
            pos += width
        y -= row_h
    c.setFont(BODY_FONT, 9)
    c.drawString(47, y - 27, "Tip: an ordinary minus sign is accepted in Program Studio; use the physical (-) key for negative input on the calculator.")
    footer(c, page_no)
    c.showPage()


def program_page(c: canvas.Canvas, page_no: int, number: int, program: dict) -> None:
    zh_title, use_zh, inputs_zh, outputs_zh = META[program["id"]]
    c.setFillColor(colors.black)
    c.setFont("Helvetica-Bold", 25)
    c.drawString(44, PAGE_H - 52, f"Program {number}")
    c.setLineWidth(1.4)
    c.line(44, PAGE_H - 58, 174, PAGE_H - 58)
    c.setFont("Helvetica-Bold", 18)
    c.drawString(44, PAGE_H - 86, program["title"])
    c.setFont(BODY_BOLD, 17)
    c.drawString(44, PAGE_H - 111, zh_title)

    c.setFillColor(colors.HexColor("#111111"))
    c.roundRect(44, PAGE_H - 174, 68, 43, 8, stroke=0, fill=1)
    c.setFillColor(colors.white)
    c.setFont(BODY_BOLD, 18)
    c.drawCentredString(78, PAGE_H - 158, "用法")
    c.setFillColor(colors.black)
    use_lines = wrap(use_zh, BODY_FONT, 11, 437)
    draw_lines(c, use_lines, 126, PAGE_H - 144, BODY_FONT, 11, 16, 3)

    c.setFillColor(colors.HexColor("#F3F3F3"))
    c.roundRect(44, PAGE_H - 249, PAGE_W - 88, 58, 6, stroke=0, fill=1)
    c.setFillColor(colors.black)
    c.setFont("Helvetica-Bold", 9.5)
    c.drawString(56, PAGE_H - 211, "INPUT")
    c.drawString(56, PAGE_H - 232, "OUTPUT")
    c.setFont(BODY_FONT, 9)
    c.drawString(111, PAGE_H - 211, inputs_zh)
    c.drawString(111, PAGE_H - 232, outputs_zh)
    c.setFont(BODY_FONT, 8)
    c.drawRightString(PAGE_W - 54, PAGE_H - 211, f"MODE {program['mode']} · {program['bytes']} bytes")

    code_lines: list[str] = []
    for raw in program["source"].splitlines():
        pieces = wrap(raw, MONO_FONT, 6.45, PAGE_W - 116)
        code_lines.extend(pieces or [""])
    code_leading = 7.7
    code_h = max(104, min(258, len(code_lines) * code_leading + 32))
    code_top = PAGE_H - 276
    code_bottom = code_top - code_h
    c.setFont("Helvetica-Bold", 11)
    c.drawString(44, code_top + 9, "Program steps")
    c.setFillColor(colors.HexColor("#FAFAFA"))
    c.setStrokeColor(colors.HexColor("#777777"))
    c.roundRect(44, code_bottom, PAGE_W - 88, code_h - 10, 5, stroke=1, fill=1)
    c.setFillColor(colors.black)
    draw_lines(c, code_lines, 56, code_top - 17, MONO_FONT, 6.45, code_leading)

    example_top = code_bottom - 22
    c.setFont(BODY_BOLD, 12)
    c.drawString(44, example_top, "示範 Example")
    example_lines = wrap(program["example"], BODY_FONT, 8.5, PAGE_W - 110)
    example_box_h = min(112, max(52, len(example_lines) * 11 + 18))
    c.setFillColor(colors.HexColor("#F5F5F5"))
    c.roundRect(44, example_top - example_box_h - 9, PAGE_W - 88, example_box_h, 5, stroke=0, fill=1)
    c.setFillColor(colors.black)
    draw_lines(c, example_lines, 56, example_top - 27, BODY_FONT, 8.5, 11, 8)

    note_y = max(49, example_top - example_box_h - 31)
    c.setFont(BODY_FONT, 7.4)
    c.setFillColor(colors.HexColor("#444444"))
    note = "Paper 1: write the formula, substitution and reasoning. The program is a calculation/checking tool, not a replacement for method marks."
    draw_lines(c, wrap(note, BODY_FONT, 7.4, PAGE_W - 90), 45, note_y, BODY_FONT, 7.4, 9, 2)
    footer(c, page_no)
    c.showPage()


def main() -> None:
    register_fonts()
    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    programs = catalog["programs"]
    if [p["id"] for p in programs] != list(META):
        raise ValueError("PDF metadata order does not match the curated catalog")
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(OUTPUT), pagesize=(PAGE_W, PAGE_H), pageCompression=1)
    c.setTitle("CASIO fx-50FH II - Curated S5 Program Library")
    c.setAuthor("throwingogo-hub")
    c.setSubject("Tested HKDSE S5 calculator programs")
    cover_page(c, programs)
    reference_page(c, 2)
    for index, program in enumerate(programs, 1):
        program_page(c, index + 2, index, program)
    c.save()
    print(OUTPUT)


if __name__ == "__main__":
    main()
