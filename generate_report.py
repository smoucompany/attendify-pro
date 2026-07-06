# -*- coding: utf-8 -*-
"""
Attendify Pro — Professional PDF Report Generator
Clean, consistent enterprise design with Arabic RTL support.
"""

import sys, os
from datetime import datetime
from fpdf import FPDF
from fpdf.enums import RenderStyle
import arabic_reshaper
from bidi.algorithm import get_display

# ── Fonts ─────────────────────────────────────────────────────────────────────
FONT_REG  = r"C:\Windows\Fonts\Amiri Regular.ttf"
FONT_BOLD = r"C:\Windows\Fonts\Amiri Bold.ttf"

# ── Color palette ─────────────────────────────────────────────────────────────
P   = (91,  91,  214)   # primary   #5B5BD6
PL  = (238, 242, 255)   # primary light
INK = (17,  24,  39)    # dark text
GR  = (107, 114, 128)   # gray text
BD  = (229, 231, 235)   # border
BG  = (248, 249, 250)   # subtle bg
WH  = (255, 255, 255)
OK  = (16,  185, 129)   # success
WN  = (245, 158, 11)    # warning
ER  = (239, 68,  68)    # danger
OKL = (240, 253, 244)
WNL = (255, 251, 235)
ERL = (254, 242, 242)

M   = 14                # page margin mm
LH  = 8                 # default line height mm


def ar(t):
    return get_display(arabic_reshaper.reshape(str(t)))


# ─── Sample data ──────────────────────────────────────────────────────────────
COMPANY  = {"name": "شركة الفجر للتقنية", "city": "الرياض", "period": "يونيو 2026"}
TODAY    = "2026-06-22"

EMPLOYEES = [
    {"id":"E001","name":"أحمد محمد السعيد",      "dept":"تقنية المعلومات","pos":"مطور برمجيات"},
    {"id":"E002","name":"سارة عبدالله الحربي",   "dept":"الموارد البشرية","pos":"مسؤولة HR"},
    {"id":"E003","name":"خالد عمر الزهراني",     "dept":"المالية",         "pos":"محاسب أول"},
    {"id":"E004","name":"نورة سالم القحطاني",    "dept":"التسويق",         "pos":"مدير تسويق"},
    {"id":"E005","name":"محمد ياسر الغامدي",     "dept":"تقنية المعلومات","pos":"مهندس شبكات"},
    {"id":"E006","name":"ريم فهد العتيبي",       "dept":"المبيعات",        "pos":"مندوبة مبيعات"},
    {"id":"E007","name":"عبدالرحمن الدوسري",     "dept":"العمليات",        "pos":"مشرف عمليات"},
    {"id":"E008","name":"هند جاسر الشمري",       "dept":"خدمة العملاء",   "pos":"ممثل خدمة"},
    {"id":"E009","name":"فيصل ناصر المالكي",     "dept":"تقنية المعلومات","pos":"مدير IT"},
    {"id":"E010","name":"أميرة وليد السبيعي",    "dept":"الموارد البشرية","pos":"محلل HR"},
]

ATTENDANCE = [
    {"id":"E001","in":"08:02","out":"17:05","status":"present"},
    {"id":"E002","in":"09:45","out":"17:00","status":"late"},
    {"id":"E003","in":None,   "out":None,   "status":"absent"},
    {"id":"E004","in":"07:58","out":"16:55","status":"present"},
    {"id":"E005","in":"08:10","out":"17:20","status":"present"},
    {"id":"E006","in":"10:05","out":"17:00","status":"late"},
    {"id":"E007","in":"08:00","out":"17:00","status":"present"},
    {"id":"E008","in":None,   "out":None,   "status":"absent"},
    {"id":"E009","in":"08:30","out":"18:00","status":"present"},
    {"id":"E010","in":"08:05","out":"17:10","status":"present"},
]

WEEK = [
    {"d":"الأحد",    "p":8,"l":1,"a":1},
    {"d":"الاثنين",  "p":7,"l":2,"a":1},
    {"d":"الثلاثاء", "p":9,"l":0,"a":1},
    {"d":"الأربعاء", "p":6,"l":3,"a":1},
    {"d":"الخميس",   "p":8,"l":1,"a":1},
]

DEPTS = [
    {"n":"تقنية المعلومات","total":3,"present":3},
    {"n":"الموارد البشرية","total":2,"present":2},
    {"n":"المالية",         "total":1,"present":0},
    {"n":"التسويق",         "total":1,"present":1},
    {"n":"المبيعات",        "total":1,"present":1},
    {"n":"العمليات",        "total":1,"present":1},
    {"n":"خدمة العملاء",   "total":1,"present":0},
]


# ════════════════════════════════════════════════════════════════════════════════
class PDF(FPDF):
    def __init__(self):
        super().__init__("P", "mm", "A4")
        self.set_auto_page_break(True, 18)
        self.add_font("R",  fname=FONT_REG)
        self.add_font("R",  style="B", fname=FONT_BOLD)
        self._is_cover = False

    # ── shared header ─────────────────────────────────────────────────────────
    def header(self):
        if self._is_cover:
            return
        # thin primary top bar
        self.set_fill_color(*P)
        self.rect(0, 0, 210, 5, "F")
        # company + page info on same line
        self.set_y(8)
        self.set_font("R", "B", 9)
        self.set_text_color(*P)
        self.cell(0, 5, ar(COMPANY["name"]), align="R", new_x="LMARGIN", new_y="NEXT")
        self.set_draw_color(*BD)
        self.set_line_width(0.3)
        self.line(M, 15, 210 - M, 15)
        self.ln(4)

    def footer(self):
        if self._is_cover:
            return
        self.set_y(-14)
        self.set_draw_color(*BD)
        self.set_line_width(0.3)
        self.line(M, self.get_y(), 210 - M, self.get_y())
        self.set_font("R", "", 8)
        self.set_text_color(*GR)
        pg = self.page - 1
        self.cell(0, 8, f"Attendify Pro  ·  {TODAY}  ·  {ar('صفحة')} {pg}", align="C")

    # ── drawing helpers ───────────────────────────────────────────────────────
    def rr(self, x, y, w, h, r=4, style="F"):
        if w <= 0 or h <= 0:
            return
        rs = {"F":RenderStyle.F,"D":RenderStyle.D,"DF":RenderStyle.DF}.get(style, RenderStyle.F)
        r = min(r, w / 2, h / 2)
        if r <= 0.5:
            self.rect(x, y, w, h, style)
        else:
            self._draw_rounded_rect(x, y, w, h, rs, True, r)

    def hline(self, color=BD, lw=0.25):
        self.set_draw_color(*color)
        self.set_line_width(lw)
        self.line(M, self.get_y(), 210 - M, self.get_y())

    def section(self, title):
        self.ln(5)
        y = self.get_y()
        self.set_fill_color(*P)
        self.rect(M, y, 4, 7, "F")
        self.set_xy(M + 6, y)
        self.set_font("R", "B", 12)
        self.set_text_color(*INK)
        self.cell(0, 7, ar(title), align="R")
        self.ln(10)

    def cell_r(self, w, h, txt, border=0, align="C", fill=False, ln=False):
        """Cell with pre-shaped Arabic text."""
        self.cell(w, h, ar(str(txt)), border=border, align=align, fill=fill,
                  new_x="LMARGIN" if ln else "RIGHT", new_y="NEXT" if ln else "TOP")

    def kpi_box(self, x, y, w, h, value, label, color, bg):
        self.set_fill_color(*bg)
        self.rr(x, y, w, h, 5)
        # top accent stripe
        self.set_fill_color(*color)
        self.rr(x, y, w, 3.5, 3)
        # value
        self.set_font("R", "B", 22)
        self.set_text_color(*color)
        self.set_xy(x, y + 6)
        self.cell(w, 10, str(value), align="C")
        # label
        self.set_font("R", "", 8)
        self.set_text_color(*GR)
        self.set_xy(x, y + 17)
        self.cell(w, 6, ar(label), align="C")

    def th(self, headers, widths):
        """Table header row."""
        self.set_fill_color(*P)
        self.set_text_color(*WH)
        self.set_font("R", "B", 9)
        self.set_line_width(0)
        x0 = M
        for lbl, w in zip(reversed(headers), reversed(widths)):
            self.set_x(x0)
            self.cell(w, 9, ar(lbl), border=0, align="C", fill=True)
            x0 += w
        self.ln(9)
        self.set_draw_color(*BD)

    def tr(self, values, widths, row_idx, aligns=None, colors=None):
        """Table data row."""
        aligns = aligns or ["C"] * len(widths)
        colors = colors or [None] * len(widths)
        fill   = row_idx % 2 == 0
        self.set_fill_color(*BG if fill else WH)
        y_row = self.get_y()
        x0    = M
        for val, w, align, col in zip(reversed(values), reversed(widths), reversed(aligns), reversed(colors)):
            self.set_x(x0)
            if col:
                self.set_text_color(*col)
            else:
                self.set_text_color(*INK)
            self.set_font("R", "", 9)
            self.cell(w, 8.5, ar(str(val)), border=0, align=align, fill=fill)
            x0 += w
        self.set_draw_color(*BD)
        self.set_line_width(0.2)
        self.line(M, y_row + 8.5, 210 - M, y_row + 8.5)
        self.ln(8.5)

    def badge(self, x, y, w, text, color, bg):
        self.set_fill_color(*bg)
        self.rr(x, y, w, 5.5, 2.5)
        self.set_font("R", "B", 7.5)
        self.set_text_color(*color)
        self.set_xy(x, y + 0.2)
        self.cell(w, 5.5, ar(text), align="C")


# ════════════════════════════════════════════════════════════════════════════════
# PAGE 1 — COVER
# ════════════════════════════════════════════════════════════════════════════════
def page_cover(pdf: PDF):
    pdf._is_cover = True
    pdf.add_page()

    W, H = 210, 297

    # — full dark background ———————————————————————————————————————————————————
    pdf.set_fill_color(15, 15, 17)
    pdf.rect(0, 0, W, H, "F")

    # — primary accent top bar ————————————————————————————————————————————————
    pdf.set_fill_color(*P)
    pdf.rect(0, 0, W, 10, "F")

    # — left white sidebar strip ——————————————————————————————————————————————
    pdf.set_fill_color(22, 22, 25)
    pdf.rect(0, 10, 62, H - 10, "F")
    pdf.set_draw_color(35, 35, 40)
    pdf.set_line_width(0.4)
    pdf.line(62, 10, 62, H)

    # sidebar: logo circle ————————————————————————————————————————————————————
    cx, cy, cr = 31, 60, 20
    pdf.set_fill_color(*P)
    pdf.ellipse(cx - cr, cy - cr, cr * 2, cr * 2, "F")
    # fingerprint rings
    pdf.set_draw_color(255, 255, 255)
    for r in [15, 10, 5]:
        pdf.set_line_width(1.1)
        pdf.ellipse(cx - r, cy - r, r * 2, r * 2, "D")
    pdf.set_fill_color(255, 255, 255)
    pdf.ellipse(cx - 1.5, cy - 1.5, 3, 3, "F")

    # sidebar: app name ———————————————————————————————————————————————————————
    pdf.set_font("R", "B", 15)
    pdf.set_text_color(255, 255, 255)
    pdf.set_xy(0, 84)
    pdf.cell(62, 8, "Attendify", align="C")
    pdf.set_font("R", "", 9)
    pdf.set_text_color(*P)
    pdf.set_xy(0, 92)
    pdf.cell(62, 5, "Pro", align="C")

    # sidebar: divider
    pdf.set_draw_color(40, 40, 50)
    pdf.set_line_width(0.4)
    pdf.line(12, 103, 50, 103)

    # sidebar: KPI numbers ————————————————————————————————————————————————————
    total   = len(ATTENDANCE)
    present = sum(1 for a in ATTENDANCE if a["status"] == "present")
    late    = sum(1 for a in ATTENDANCE if a["status"] == "late")
    absent  = sum(1 for a in ATTENDANCE if a["status"] == "absent")
    rate    = round((present + late) / total * 100) if total else 0

    sidebar_kpis = [
        (str(total),        "إجمالي الموظفين",  WH),
        (str(present),      "حاضرون",            (16*2, min(255, 185*2//1), 150)),
        (str(late),         "متأخرون",           (245, 200, 100)),
        (f"{rate}%",        "الالتزام",           P),
    ]
    sy = 112
    for val, lbl, col in sidebar_kpis:
        pdf.set_font("R", "B", 18)
        pdf.set_text_color(*col)
        pdf.set_xy(0, sy)
        pdf.cell(62, 10, val, align="C")
        pdf.set_font("R", "", 7.5)
        pdf.set_text_color(120, 120, 135)
        pdf.set_xy(0, sy + 10)
        pdf.cell(62, 5, ar(lbl), align="C")
        # small dot separator
        pdf.set_fill_color(*col)
        pdf.ellipse(28.5, sy + 17, 3, 0.8, "F")
        sy += 26

    # sidebar: generated by ———————————————————————————————————————————————————
    pdf.set_font("R", "", 7)
    pdf.set_text_color(50, 50, 60)
    pdf.set_xy(0, 275)
    pdf.cell(62, 4, "Generated by Attendify Pro", align="C")
    pdf.set_xy(0, 280)
    pdf.cell(62, 4, TODAY, align="C")

    # — main content area (right of sidebar) ——————————————————————————————————
    RX = 68   # right area start x
    RW = 210 - RX - 10

    # large report title
    pdf.set_font("R", "B", 32)
    pdf.set_text_color(255, 255, 255)
    pdf.set_xy(RX, 42)
    pdf.cell(RW, 16, ar("تقرير الحضور"), align="R")

    pdf.set_font("R", "B", 18)
    pdf.set_text_color(*P)
    pdf.set_xy(RX, 59)
    pdf.cell(RW, 9, ar("والانصراف الشهري"), align="R")

    # divider
    pdf.set_draw_color(50, 50, 80)
    pdf.set_line_width(0.5)
    pdf.line(RX, 73, 200, 73)

    # company name + city
    pdf.set_font("R", "B", 13)
    pdf.set_text_color(220, 220, 230)
    pdf.set_xy(RX, 78)
    pdf.cell(RW, 7, ar(COMPANY["name"]), align="R")

    pdf.set_font("R", "", 9)
    pdf.set_text_color(120, 120, 135)
    pdf.set_xy(RX, 86)
    pdf.cell(RW, 5, ar(COMPANY["city"]), align="R")

    # period badge
    pdf.set_fill_color(*P)
    pdf.rr(140, 96, 60, 11, 4)
    pdf.set_font("R", "B", 10)
    pdf.set_text_color(255, 255, 255)
    pdf.set_xy(140, 96)
    pdf.cell(60, 11, ar(COMPANY["period"]), align="C")

    # — 5 KPI cards ———————————————————————————————————————————————————————————
    kpis = [
        (str(total),        "الإجمالي",    P,   PL),
        (str(present),      "حاضرون",      OK,  OKL),
        (str(late),         "متأخرون",     WN,  WNL),
        (str(absent),       "غائبون",      ER,  ERL),
        (f"{rate}%",        "الالتزام",    P,   PL),
    ]
    cw  = (RW - 4 * 3) / 5
    cx0 = RX
    cy0 = 118
    for i, (val, lbl, col, bg) in enumerate(kpis):
        bx = cx0 + i * (cw + 3)
        # card
        pdf.set_fill_color(*bg)
        pdf.rr(bx, cy0, cw, 32, 4)
        # top accent
        pdf.set_fill_color(*col)
        pdf.rr(bx, cy0, cw, 3, 3)
        # value
        pdf.set_font("R", "B", 16)
        pdf.set_text_color(*col)
        pdf.set_xy(bx, cy0 + 6)
        pdf.cell(cw, 9, val, align="C")
        # label
        pdf.set_font("R", "", 7.5)
        pdf.set_text_color(*GR)
        pdf.set_xy(bx, cy0 + 16)
        pdf.cell(cw, 5, ar(lbl), align="C")

    # — decorative bottom strip ———————————————————————————————————————————————
    pdf.set_fill_color(22, 22, 25)
    pdf.rect(62, 265, 148, 32, "F")
    pdf.set_fill_color(*P)
    pdf.rect(62, 265, 2, 32, "F")

    info = [
        ("تاريخ الإصدار",  TODAY),
        ("الوقت",          datetime.now().strftime("%H:%M")),
        ("سرية",           "داخلي"),
    ]
    iw = (148 - 6) / 3
    for i, (lbl, val) in enumerate(info):
        ix = 66 + i * iw
        pdf.set_font("R", "", 7)
        pdf.set_text_color(100, 100, 115)
        pdf.set_xy(ix, 270)
        pdf.cell(iw, 5, ar(lbl), align="R")
        pdf.set_font("R", "B", 9)
        pdf.set_text_color(200, 200, 210)
        pdf.set_xy(ix, 276)
        pdf.cell(iw, 5, ar(val), align="R")

    pdf._is_cover = False


# ════════════════════════════════════════════════════════════════════════════════
# PAGE 2 — EXECUTIVE SUMMARY
# ════════════════════════════════════════════════════════════════════════════════
def page_summary(pdf: PDF):
    pdf.add_page()
    pdf.section(ar("ملخص تنفيذي"))

    total   = len(ATTENDANCE)
    present = sum(1 for a in ATTENDANCE if a["status"] == "present")
    late    = sum(1 for a in ATTENDANCE if a["status"] == "late")
    absent  = sum(1 for a in ATTENDANCE if a["status"] == "absent")
    rate    = round((present + late) / total * 100) if total else 0

    # — 5 KPI boxes in a row ——————————————————————————————————————————————————
    W_CONTENT = 210 - 2 * M
    GAP  = 3
    BW   = (W_CONTENT - 4 * GAP) / 5
    BH   = 32
    BY   = pdf.get_y()
    kpis = [
        (str(total),   "إجمالي الموظفين",  P,  PL),
        (str(present), "الحاضرون",          OK, OKL),
        (str(late),    "المتأخرون",         WN, WNL),
        (str(absent),  "الغائبون",          ER, ERL),
        (f"{rate}%",   "معدل الالتزام",     P,  PL),
    ]
    for i, (val, lbl, col, bg) in enumerate(kpis):
        bx = M + i * (BW + GAP)
        pdf.kpi_box(bx, BY, BW, BH, val, lbl, col, bg)
    pdf.set_y(BY + BH + 8)

    # — weekly attendance bar chart ———————————————————————————————————————————
    pdf.section(ar("حضور الأسبوع"))
    CH   = 54
    CX   = M
    CY   = pdf.get_y()
    CW   = 210 - 2 * M
    BMAX = max(d["p"] + d["l"] + d["a"] for d in WEEK) or 10
    BH2  = CH - 12
    GW   = CW / len(WEEK)

    # chart background
    pdf.set_fill_color(*BG)
    pdf.rr(CX, CY, CW, CH, 4)

    # gridlines (horizontal, every 2 employees)
    step = 2
    for g in range(0, BMAX + 1, step):
        gy = CY + CH - 10 - (g / BMAX) * BH2
        pdf.set_draw_color(*BD)
        pdf.set_line_width(0.15)
        pdf.set_dash_pattern(dash=1.5, gap=1)
        pdf.line(CX + 10, gy, CX + CW - 2, gy)
        pdf.set_dash_pattern()
        pdf.set_font("R", "", 6.5)
        pdf.set_text_color(*GR)
        pdf.set_xy(CX + 1, gy - 2.5)
        pdf.cell(8, 5, str(g), align="C")

    # bars
    bar_cfg = [
        ("p", P,  PL),
        ("l", WN, WNL),
        ("a", ER, ERL),
    ]
    for di, day in enumerate(WEEK):
        GX    = CX + 10 + di * ((CW - 10) / len(WEEK))
        IW    = (CW - 10) / len(WEEK) * 0.75
        bar_w = IW / 3
        for bi, (key, col, _) in enumerate(bar_cfg):
            val = day[key]
            bh  = (val / BMAX) * BH2 if BMAX else 0
            bx  = GX + bi * bar_w
            by  = CY + CH - 10 - bh
            pdf.set_fill_color(*col)
            pdf.rr(bx, by, bar_w - 0.5, bh, 2 if bh > 3 else 0)
            if val > 0 and bh > 5:
                pdf.set_font("R", "B", 6)
                pdf.set_text_color(*WH)
                pdf.set_xy(bx, by + 0.5)
                pdf.cell(bar_w - 0.5, 4, str(val), align="C")
        # day label
        pdf.set_font("R", "B", 7.5)
        pdf.set_text_color(*INK)
        pdf.set_xy(GX, CY + CH - 9)
        pdf.cell((CW - 10) / len(WEEK), 7, ar(day["d"]), align="C")

    # legend
    legend = [("حاضر", P), ("متأخر", WN), ("غائب", ER)]
    lx = CX + CW - 55
    for i, (lbl, col) in enumerate(legend):
        rx = lx + i * 18
        pdf.set_fill_color(*col)
        pdf.rr(rx, CY + 4, 5, 4, 1)
        pdf.set_font("R", "", 7)
        pdf.set_text_color(*GR)
        pdf.set_xy(rx + 6, CY + 3)
        pdf.cell(10, 5, ar(lbl))

    pdf.set_y(CY + CH + 8)

    # — departments table ——————————————————————————————————————————————————————
    pdf.section(ar("تفصيل الأقسام"))
    hdrs = ["القسم", "الإجمالي", "الحاضرون", "الغائبون", "نسبة الحضور"]
    wds  = [65, 25, 25, 25, 42]
    pdf.th(hdrs, wds)

    for ri, d in enumerate(DEPTS):
        ab   = d["total"] - d["present"]
        rt   = round(d["present"] / d["total"] * 100) if d["total"] else 0
        col  = OK if rt >= 80 else WN if rt >= 60 else ER
        fill = ri % 2 == 0
        yr   = pdf.get_y()
        pdf.set_fill_color(*BG if fill else WH)
        pdf.rect(M, yr, sum(wds), 10, "F")

        # dept name (with color dot)
        pdf.set_fill_color(*P)
        pdf.ellipse(M + 2, yr + 3.5, 3, 3, "F")
        pdf.set_font("R", "B", 9)
        pdf.set_text_color(*INK)
        pdf.set_xy(M + 7, yr)
        pdf.cell(wds[0] - 7, 10, ar(d["n"]), align="R")

        x2 = M + wds[0]
        for val, w in zip([d["total"], d["present"], ab], wds[1:4]):
            pdf.set_font("R", "", 9)
            pdf.set_text_color(*INK)
            pdf.set_xy(x2, yr)
            pdf.cell(w, 10, str(val), align="C")
            x2 += w

        # progress bar in last column
        bw  = wds[4] - 18
        bx  = x2 + 2
        by  = yr + 3.5
        pdf.set_fill_color(*BD)
        pdf.rr(bx, by, bw, 3, 1.5)
        if rt > 0:
            pdf.set_fill_color(*col)
            pdf.rr(bx, by, bw * rt / 100, 3, 1.5)
        pdf.set_font("R", "B", 8)
        pdf.set_text_color(*col)
        pdf.set_xy(bx + bw + 2, yr + 1)
        pdf.cell(12, 7, f"{rt}%", align="L")

        pdf.set_draw_color(*BD)
        pdf.set_line_width(0.2)
        pdf.line(M, yr + 10, M + sum(wds), yr + 10)
        pdf.ln(10)


# ════════════════════════════════════════════════════════════════════════════════
# PAGE 3 — ATTENDANCE DETAIL
# ════════════════════════════════════════════════════════════════════════════════
def page_attendance(pdf: PDF):
    pdf.add_page()
    pdf.section(ar("تفاصيل الحضور اليومي"))
    pdf.set_font("R", "", 8.5)
    pdf.set_text_color(*GR)
    pdf.set_x(M)
    pdf.cell(0, 5, ar(f"التاريخ: {TODAY}  ·  إجمالي الموظفين: {len(ATTENDANCE)}"), align="R")
    pdf.ln(7)

    STATUS_CFG = {
        "present": (OK,  OKL, "حاضر"),
        "late":    (WN,  WNL, "متأخر"),
        "absent":  (ER,  ERL, "غائب"),
    }
    emp_map = {e["id"]: e for e in EMPLOYEES}

    hdrs = ["الموظف", "القسم", "الوظيفة", "الحضور", "الانصراف", "الساعات", "الحالة"]
    wds  = [42, 34, 32, 22, 22, 20, 10]

    pdf.th(hdrs, wds)

    for ri, att in enumerate(ATTENDANCE):
        emp = emp_map.get(att["id"], {})
        col, bg, lbl = STATUS_CFG.get(att["status"], (GR, BG, att["status"]))

        ci = att["in"]  or "—"
        co = att["out"] or "—"
        dur = "—"
        if att["in"] and att["out"]:
            from datetime import datetime as dt
            t1 = dt.strptime(att["in"],  "%H:%M")
            t2 = dt.strptime(att["out"], "%H:%M")
            m  = int((t2 - t1).total_seconds() // 60)
            dur = f"{m//60}:{m%60:02d}"

        fill = ri % 2 == 0
        yr   = pdf.get_y()
        H_ROW = 9

        pdf.set_fill_color(*BG if fill else WH)
        pdf.rect(M, yr, sum(wds), H_ROW, "F")

        # employee name with color marker
        pdf.set_fill_color(*col)
        pdf.rect(M, yr, 2.5, H_ROW, "F")
        pdf.set_font("R", "B", 8.5)
        pdf.set_text_color(*INK)
        pdf.set_xy(M + 3, yr)
        pdf.cell(wds[0] - 3, H_ROW, ar(emp.get("name", att["id"])), align="R")

        x2 = M + wds[0]
        for val, w in zip(
            [emp.get("dept",""), emp.get("pos",""), ci, co, dur],
            wds[1:6]
        ):
            pdf.set_font("R", "", 8.5)
            pdf.set_text_color(*GR if isinstance(val, str) and val in ("—",) else INK)
            pdf.set_xy(x2, yr)
            pdf.cell(w, H_ROW, ar(str(val)), align="C")
            x2 += w

        # status badge (last column is just 10mm — use full width)
        pdf.badge(x2 - 1, yr + 1.5, wds[6] + 10, lbl, col, bg)

        pdf.set_draw_color(*BD)
        pdf.set_line_width(0.18)
        pdf.line(M, yr + H_ROW, M + sum(wds), yr + H_ROW)
        pdf.ln(H_ROW)

    # — summary bar ————————————————————————————————————————————————————————————
    pdf.ln(4)
    total   = len(ATTENDANCE)
    present = sum(1 for a in ATTENDANCE if a["status"] == "present")
    late    = sum(1 for a in ATTENDANCE if a["status"] == "late")
    absent  = sum(1 for a in ATTENDANCE if a["status"] == "absent")
    rate    = round((present + late) / total * 100)

    sy = pdf.get_y()
    pdf.set_fill_color(*P)
    pdf.rr(M, sy, 210 - 2*M, 18, 5)

    totals = [
        (str(total),   "إجمالي"),
        (str(present), "حاضرون"),
        (str(late),    "متأخرون"),
        (str(absent),  "غائبون"),
        (f"{rate}%",   "الالتزام"),
    ]
    bw2 = (210 - 2 * M) / 5
    for i, (val, lbl) in enumerate(totals):
        bx = M + i * bw2
        pdf.set_font("R", "B", 12)
        pdf.set_text_color(*WH)
        pdf.set_xy(bx, sy + 1)
        pdf.cell(bw2, 8, val, align="C")
        pdf.set_font("R", "", 7)
        pdf.set_text_color(200, 200, 255)
        pdf.set_xy(bx, sy + 10)
        pdf.cell(bw2, 6, ar(lbl), align="C")


# ════════════════════════════════════════════════════════════════════════════════
# PAGE 4 — EMPLOYEE DIRECTORY
# ════════════════════════════════════════════════════════════════════════════════
def page_employees(pdf: PDF):
    pdf.add_page()
    pdf.section(ar("دليل الموظفين"))

    hdrs = ["الرقم", "الاسم الكامل", "القسم", "المسمى الوظيفي", "حالة اليوم"]
    wds  = [18, 50, 40, 46, 28]
    att_map = {a["id"]: a["status"] for a in ATTENDANCE}

    STATUS_CFG = {
        "present": (OK,  OKL, "حاضر"),
        "late":    (WN,  WNL, "متأخر"),
        "absent":  (ER,  ERL, "غائب"),
    }

    pdf.th(hdrs, wds)

    for ri, emp in enumerate(EMPLOYEES):
        status = att_map.get(emp["id"], "absent")
        col, bg, lbl = STATUS_CFG.get(status, (GR, BG, "—"))
        fill = ri % 2 == 0
        yr   = pdf.get_y()

        pdf.set_fill_color(*BG if fill else WH)
        pdf.rect(M, yr, sum(wds), 9, "F")

        # ID
        pdf.set_font("R", "", 8)
        pdf.set_text_color(*GR)
        pdf.set_xy(M, yr)
        pdf.cell(wds[0], 9, emp["id"], align="C")
        # Name
        pdf.set_font("R", "B", 9)
        pdf.set_text_color(*INK)
        pdf.set_xy(M + wds[0], yr)
        pdf.cell(wds[1], 9, ar(emp["name"]), align="R")
        # Dept
        pdf.set_font("R", "", 8.5)
        pdf.set_text_color(*GR)
        pdf.set_xy(M + wds[0] + wds[1], yr)
        pdf.cell(wds[2], 9, ar(emp["dept"]), align="C")
        # Position
        pdf.set_xy(M + wds[0] + wds[1] + wds[2], yr)
        pdf.cell(wds[3], 9, ar(emp["pos"]), align="C")
        # Badge
        bx = M + wds[0] + wds[1] + wds[2] + wds[3] + 2
        pdf.badge(bx, yr + 1.5, wds[4] - 4, lbl, col, bg)

        pdf.set_draw_color(*BD)
        pdf.set_line_width(0.18)
        pdf.line(M, yr + 9, M + sum(wds), yr + 9)
        pdf.ln(9)

    # — official signature block ———————————————————————————————————————————————
    pdf.ln(10)
    sy = pdf.get_y()

    pdf.set_fill_color(*BG)
    pdf.rr(M, sy, 210 - 2 * M, 38, 5)
    pdf.set_fill_color(*P)
    pdf.rr(M, sy, 3, 38, 2)

    pdf.set_font("R", "B", 10)
    pdf.set_text_color(*INK)
    pdf.set_xy(M, sy + 5)
    pdf.cell(210 - 2 * M, 6, ar("توقيع المسؤول وختم الشركة"), align="R")

    pdf.set_font("R", "", 8)
    pdf.set_text_color(*GR)
    pdf.set_xy(M, sy + 12)
    pdf.cell(210 - 2 * M, 5, ar("أُعِدَّ هذا التقرير آلياً بواسطة نظام Attendify Pro لإدارة الحضور والانصراف"), align="R")

    # signature line left + right
    pdf.set_draw_color(*INK)
    pdf.set_line_width(0.4)
    pdf.line(M + 6, sy + 34, M + 56, sy + 34)
    pdf.set_font("R", "", 7)
    pdf.set_text_color(*GR)
    pdf.set_xy(M + 6, sy + 35)
    pdf.cell(50, 4, ar("اسم وتوقيع المدير"), align="C")

    pdf.line(210 - M - 56, sy + 34, 210 - M - 6, sy + 34)
    pdf.set_xy(210 - M - 56, sy + 35)
    pdf.cell(50, 4, ar("الختم الرسمي"), align="C")

    # issue info
    pdf.set_font("R", "", 7.5)
    pdf.set_text_color(*GR)
    pdf.set_xy(M, sy + 27)
    pdf.cell(210 - 2 * M, 5, ar(f"تاريخ الإصدار: {TODAY}  ·  الفترة: {COMPANY['period']}  ·  سري — للاستخدام الداخلي فقط"), align="C")


# ════════════════════════════════════════════════════════════════════════════════
def main():
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "attendify_report.pdf")
    pdf = PDF()

    print("  [1/4] صفحة الغلاف ...")
    page_cover(pdf)

    print("  [2/4] الملخص التنفيذي ...")
    page_summary(pdf)

    print("  [3/4] جدول الحضور التفصيلي ...")
    page_attendance(pdf)

    print("  [4/4] دليل الموظفين ...")
    page_employees(pdf)

    pdf.output(out)
    size = os.path.getsize(out) // 1024
    print(f"\n  ✓ التقرير جاهز : {out}")
    print(f"    الصفحات       : {pdf.page}")
    print(f"    الحجم         : {size} KB")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
