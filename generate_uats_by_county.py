import csv
import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

# Fișierele oficiale exportate de tine
JUD_CSV = BASE_DIR / "Judete.csv"
UAT_CSV = BASE_DIR / "UAT.csv"

# Fișierele de ieșire pentru frontend
COUNTIES_JS = BASE_DIR / "frontend" / "src" / "constants" / "romanianCounties.js"
UATS_JSON = BASE_DIR / "frontend" / "src" / "constants" / "uatsByCounty.json"


def find_pk_column(fieldnames):
    """Găsește coloana de tip NOMEN_PK (cu sau fără BOM)."""
    for col in fieldnames:
        if col.endswith("NOMEN_PK"):
            return col
    # fallback – prima coloană, dacă nu găsim nimic
    return fieldnames[0]


def generate_counties():
    """
    Citim Judete.csv și construim:
      - county_map: { pk -> {code, name} }
      - lista de județe pentru frontend (ROMANIAN_COUNTIES)
    """
    county_map = {}
    counties = []

    with JUD_CSV.open(encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames or []
        pk_col = find_pk_column(fieldnames)

        print("[INFO] Judete.csv – coloane:", fieldnames)
        print("[INFO] Judete.csv – folosesc coloana PK:", pk_col)

        for row in reader:
            pk_raw = (row.get(pk_col) or "").strip()
            if not pk_raw:
                continue

            try:
                pk = int(pk_raw)
            except ValueError:
                continue

            code = (row.get("CODE") or "").strip()
            name = (row.get("NAME") or "").strip()

            if not code or not name:
                continue

            # Scoatem ANCPI și orice cod care nu e de tip judet (1–2 litere)
            if name.lower() == "ancpi" or code.upper() == "ANCPI":
                continue
            if (not code.isalpha()) or len(code) > 2:
                continue

            name_title = name.title()
            county_map[pk] = {"code": code, "name": name_title}
            counties.append({"id": code, "name": name_title})

    # eliminăm eventualele duplicate (după cod)
    unique = {}
    for c in counties:
        unique[c["id"]] = c["name"]
    counties = [{"id": k, "name": v} for k, v in unique.items()]

    counties.sort(key=lambda x: x["name"])

    js_content = (
        "// Generat automat din Judete.csv (date oficiale ANCPI)\n"
        "export const ROMANIAN_COUNTIES = "
        + json.dumps(counties, ensure_ascii=False, indent=2)
        + ";\n\nexport default ROMANIAN_COUNTIES;\n"
    )

    COUNTIES_JS.parent.mkdir(parents=True, exist_ok=True)
    COUNTIES_JS.write_text(js_content, encoding="utf-8")

    print(f"[OK] romanianCounties.js generat la: {COUNTIES_JS}")
    print(f"[OK] Județe afișate în frontend: {len(counties)}")

    return county_map


def generate_uats_by_county(county_map):
    """
    Citim UAT.csv și grupăm UAT-urile pe județe, folosind:
      UAT.COUNTY_ID -> Judete.NOMEN_PK
    """
    uats_by_county = {}

    with UAT_CSV.open(encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames or []

        print("[INFO] UAT.csv – coloane:", fieldnames)

        for row in reader:
            county_id_raw = (row.get("COUNTY_ID") or "").strip()
            if not county_id_raw:
                continue

            try:
                county_id = int(county_id_raw)
            except ValueError:
                continue

            county = county_map.get(county_id)
            if not county:
                # UAT fără corespondent în tabela de județe – îl ignorăm
                continue

            code = county["code"]  # ex: "CT"
            name = (row.get("NAME") or "").strip()
            siruta = (row.get("SIRUTA") or "").strip()

            if not name:
                continue

            # Scoatem intrarea tehnică UAT_Neidentificat
            if name.upper().startswith("UAT_NEIDENTIFICAT"):
                continue

            lst = uats_by_county.setdefault(code, [])
            if any(u["name"] == name for u in lst):
                continue  # evităm dublurile

            lst.append({
                "id": name,
                "name": name,
                "siruta": siruta
            })

    # sortăm alfabetic UAT-urile în fiecare județ
    for code, lst in uats_by_county.items():
        lst.sort(key=lambda x: x["name"])

    UATS_JSON.parent.mkdir(parents=True, exist_ok=True)
    UATS_JSON.write_text(
        json.dumps(uats_by_county, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )

    print(f"[OK] uatsByCounty.json generat la: {UATS_JSON}")
    print(f"[OK] Județe cu UAT-uri: {len(uats_by_county)}")


def main():
    county_map = generate_counties()
    generate_uats_by_county(county_map)


if __name__ == "__main__":
    main()
