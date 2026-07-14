#!/usr/bin/env python3
"""Generate the public resume PDF from content/data.ts."""

from __future__ import annotations

import json
import shutil
import subprocess
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_RIGHT
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    KeepTogether,
    ListFlowable,
    ListItem,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "pdf" / "Joscha-Koepke-Resume.pdf"
PUBLIC = ROOT / "public" / "Joscha-Koepke-Resume.pdf"


def load_resume_data() -> dict:
    script = """
      import('./content/data.ts').then(({ bio, contact, resume }) => {
        console.log(JSON.stringify({ bio, contact, resume }));
      });
    """
    result = subprocess.run(
        ["node", "--no-warnings", "--experimental-strip-types", "-e", script],
        cwd=ROOT,
        check=True,
        capture_output=True,
        text=True,
    )
    return json.loads(result.stdout)


def clean(value: str) -> str:
    replacements = {
        "\u2013": "-",
        "\u2014": "-",
        "\u2018": "'",
        "\u2019": "'",
        "\u201c": '"',
        "\u201d": '"',
        "\u00b7": " | ",
        "\u00a0": " ",
    }
    for source, target in replacements.items():
        value = value.replace(source, target)
    return value


def link(url: str, label: str) -> str:
    return f'<link href="{url}" color="#0f766e">{clean(label)}</link>'


def build_pdf(data: dict) -> None:
    bio = data["bio"]
    contact = data["contact"]
    resume = data["resume"]

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    PUBLIC.parent.mkdir(parents=True, exist_ok=True)

    document = SimpleDocTemplate(
        str(OUTPUT),
        pagesize=LETTER,
        rightMargin=0.58 * inch,
        leftMargin=0.58 * inch,
        topMargin=0.5 * inch,
        bottomMargin=0.5 * inch,
        title="Joscha Koepke - Resume",
        author="Joscha Koepke",
        subject="AI product leadership resume",
    )

    base = getSampleStyleSheet()
    ink = colors.HexColor("#0f172a")
    body_color = colors.HexColor("#334155")
    muted = colors.HexColor("#64748b")
    accent = colors.HexColor("#0f766e")
    rule = colors.HexColor("#dbe3ec")

    name_style = ParagraphStyle(
        "Name",
        parent=base["Title"],
        fontName="Helvetica-Bold",
        fontSize=25,
        leading=27,
        textColor=ink,
        spaceAfter=2,
    )
    role_style = ParagraphStyle(
        "Role",
        parent=base["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10.5,
        leading=13,
        textColor=accent,
    )
    contact_style = ParagraphStyle(
        "Contact",
        parent=base["Normal"],
        fontName="Helvetica",
        fontSize=8.5,
        leading=12,
        textColor=muted,
        alignment=TA_RIGHT,
    )
    section_style = ParagraphStyle(
        "Section",
        parent=base["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=10,
        leading=12,
        textColor=accent,
        uppercase=True,
        spaceBefore=10,
        spaceAfter=6,
    )
    body_style = ParagraphStyle(
        "Body",
        parent=base["BodyText"],
        fontName="Helvetica",
        fontSize=8.7,
        leading=12.2,
        textColor=body_color,
        spaceAfter=4,
    )
    small_style = ParagraphStyle(
        "Small",
        parent=body_style,
        fontSize=8,
        leading=10.7,
    )
    job_style = ParagraphStyle(
        "Job",
        parent=body_style,
        fontName="Helvetica-Bold",
        fontSize=10.2,
        leading=12.5,
        textColor=ink,
        spaceAfter=1,
    )
    meta_style = ParagraphStyle(
        "Meta",
        parent=small_style,
        textColor=muted,
        spaceAfter=4,
    )
    metric_style = ParagraphStyle(
        "Metric",
        parent=small_style,
        fontName="Helvetica",
        textColor=body_color,
        leading=11.2,
    )

    story = []
    header = Table(
        [
            [
                [
                    Paragraph(clean(bio["name"]), name_style),
                    Paragraph(
                        f'{clean(bio["role"])} | {clean(bio["location"])}',
                        role_style,
                    ),
                ],
                Paragraph(
                    "<br/>".join(
                        [
                            link(f'mailto:{contact["email"]}', contact["email"]),
                            link(contact["linkedin"], "linkedin.com/in/joschakoepke"),
                            link(contact["github"], "github.com/Meyk0"),
                            link("https://joschakoepke.com", "joschakoepke.com"),
                        ]
                    ),
                    contact_style,
                ),
            ]
        ],
        colWidths=[4.55 * inch, 2.35 * inch],
    )
    header.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
            ]
        )
    )
    story.extend([header, Spacer(1, 7)])
    story.append(Paragraph(clean(resume["summary"]), body_style))

    story.append(Paragraph("Selected impact", section_style))
    metrics = [
        [Paragraph(clean(item), metric_style)] for item in resume["selectedImpact"]
    ]
    metric_table = Table(metrics, colWidths=[6.9 * inch])
    metric_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
                ("BOX", (0, 0), (-1, -1), 0.6, rule),
                ("INNERGRID", (0, 0), (-1, -1), 0.4, rule),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    story.append(metric_table)

    story.append(Paragraph("Experience", section_style))
    for index, entry in enumerate(resume["experience"]):
        if index == 1:
            story.append(PageBreak())
            story.append(Paragraph("Earlier experience", section_style))
        heading = Paragraph(
            f'{clean(entry["role"])} | {clean(entry["company"])}', job_style
        )
        context = clean(entry.get("context", ""))
        meta = clean(entry["dates"])
        if context:
            meta = f"{meta} | {context}"
        bullet_items = [
            ListItem(Paragraph(clean(bullet), small_style), leftIndent=9)
            for bullet in entry["bullets"]
        ]
        job_block = [
            heading,
            Paragraph(meta, meta_style),
            ListFlowable(
                bullet_items,
                bulletType="bullet",
                start="circle",
                leftIndent=12,
                bulletFontName="Helvetica",
                bulletFontSize=5,
                bulletColor=accent,
                spaceAfter=5,
            ),
        ]
        if index == 0:
            story.extend(job_block)
        else:
            story.append(KeepTogether(job_block))

    story.append(Paragraph("Core competencies", section_style))
    competency_rows = []
    for label, value in resume["competencies"].items():
        competency_rows.append(
            [
                Paragraph(clean(label), job_style),
                Paragraph(clean(value), small_style),
            ]
        )
    competencies = Table(competency_rows, colWidths=[1.55 * inch, 5.35 * inch])
    competencies.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LINEBELOW", (0, 0), (-1, -2), 0.4, rule),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    story.append(competencies)

    story.append(Paragraph("Selected projects", section_style))
    project_items = [
        ListItem(Paragraph(clean(project), small_style), leftIndent=9)
        for project in resume["sideProjects"][:5]
    ]
    story.append(
        ListFlowable(
            project_items,
            bulletType="bullet",
            leftIndent=12,
            bulletFontSize=5,
            bulletColor=accent,
        )
    )

    story.append(Paragraph("Education", section_style))
    education_items = [
        ListItem(Paragraph(clean(item), small_style), leftIndent=9)
        for item in resume["education"]
    ]
    story.append(
        ListFlowable(
            education_items,
            bulletType="bullet",
            leftIndent=12,
            bulletFontSize=5,
            bulletColor=accent,
        )
    )

    story.append(Paragraph("Languages", section_style))
    story.append(Paragraph(" | ".join(map(clean, resume["languages"])), body_style))
    story.append(Paragraph("Interests", section_style))
    story.append(Paragraph(clean(resume["interests"]), body_style))

    def footer(canvas, doc):
        canvas.saveState()
        canvas.setStrokeColor(rule)
        canvas.setLineWidth(0.5)
        canvas.line(doc.leftMargin, 0.37 * inch, LETTER[0] - doc.rightMargin, 0.37 * inch)
        canvas.setFont("Helvetica", 7.5)
        canvas.setFillColor(muted)
        canvas.drawString(doc.leftMargin, 0.22 * inch, "joschakoepke.com")
        canvas.drawRightString(
            LETTER[0] - doc.rightMargin,
            0.22 * inch,
            f"Page {doc.page}",
        )
        canvas.restoreState()

    document.build(story, onFirstPage=footer, onLaterPages=footer)
    shutil.copyfile(OUTPUT, PUBLIC)


if __name__ == "__main__":
    build_pdf(load_resume_data())
    print(f"Generated {OUTPUT.relative_to(ROOT)}")
    print(f"Copied to {PUBLIC.relative_to(ROOT)}")
