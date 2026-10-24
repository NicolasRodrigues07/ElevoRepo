import hashlib
import hmac
import json
import os
import secrets
import threading
from datetime import datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from sessoes import (ORDENAVEIS, PRECOS, Sessao, asdict, busca_linear, estatisticas,
                     gerar_demo, merge_sort, relatorio, tarifar)

BASE = Path(__file__).parent
DB = BASE / "db.json"
PORTA = int(os.environ.get("PORT", 5000))
lock = threading.Lock()

ARQUIVOS = {"/": "index.html", "/index.html": "index.html", "/style.css": "style.css",
            "/app.js": "app.js", "/energia.js": "energia.js"}
TIPOS = {".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
         ".js": "text/javascript; charset=utf-8"}
CAMPOS = {
    "carros": ("modelo", "placa", "bateria", "ac"),
    "recargas": ("recibo", "data", "carro", "energia", "duracao_min",
                 "custo", "estrategia", "pagamento", "economia", "kwh"),
}


def agora():
    return datetime.now().isoformat(timespec="seconds")


def ler():
    if not DB.exists():
        return {"usuarios": [], "carros": [], "recargas": [], "tokens": {}}
    return json.loads(DB.read_text(encoding="utf-8"))


def gravar(d):
    DB.write_text(json.dumps(d, ensure_ascii=False, indent=2), encoding="utf-8")


def hash_senha(senha, sal=None):
    sal = sal or secrets.token_hex(8)
    h = hashlib.pbkdf2_hmac("sha256", senha.encode(), sal.encode(), 100_000).hex()
    return f"{sal}${h}"


def confere(senha, salvo):
    return hmac.compare_digest(hash_senha(senha, salvo.split("$")[0]), salvo)


def abrir_sessao(d, u):
    token = secrets.token_urlsafe(24)
    d["tokens"][token] = u["id"]
    return {"token": token, "usuario": {k: u[k] for k in ("id", "nome", "email")}}


class Handler(BaseHTTPRequestHandler):
    def enviar(self, codigo, corpo, tipo="application/json; charset=utf-8"):
        if not isinstance(corpo, bytes):
            corpo = json.dumps(corpo, ensure_ascii=False).encode("utf-8")
        self.send_response(codigo)
        self.send_header("Content-Type", tipo)
        self.send_header("Content-Length", str(len(corpo)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(corpo)

    def corpo(self):
        n = int(self.headers.get("Content-Length") or 0)
        try:
            return json.loads(self.rfile.read(n) or b"{}")
        except ValueError:
            return {}

    def do_GET(self):
        url = urlparse(self.path)
        self.q = {k: v[0] for k, v in parse_qs(url.query).items()}
        if url.path in ARQUIVOS:
            f = BASE / ARQUIVOS[url.path]
            return self.enviar(200, f.read_bytes(), TIPOS[f.suffix])
        if url.path in ("/api/carros", "/api/recargas"):
            return self.colecao(url.path[5:])
        if url.path in ("/api/sessoes", "/api/busca", "/api/estatisticas", "/api/relatorio"):
            return self.analise(url.path[5:])
        self.enviar(404, {"erro": "Não encontrado"})

    def do_POST(self):
        rotas = {"/api/registro": self.registro, "/api/login": self.login, "/api/demo": self.demo}
        if self.path in rotas:
            return rotas[self.path]()
        if self.path in ("/api/carros", "/api/recargas"):
            return self.colecao(self.path[5:])
        self.enviar(404, {"erro": "Não encontrado"})

    def registro(self):
        b = self.corpo()
        nome = (b.get("nome") or "").strip()
        email = (b.get("email") or "").strip().lower()
        senha = b.get("senha") or ""
        if not nome or "@" not in email or len(senha) < 4:
            return self.enviar(400, {"erro": "Informe nome, e-mail válido e senha com 4+ caracteres"})
        with lock:
            d = ler()
            if any(u["email"] == email for u in d["usuarios"]):
                return self.enviar(409, {"erro": "E-mail já cadastrado"})
            u = {"id": secrets.token_hex(4), "nome": nome, "email": email,
                 "senha": hash_senha(senha), "criado": agora()}
            d["usuarios"].append(u)
            r = abrir_sessao(d, u)
            gravar(d)
        self.enviar(201, r)

    def login(self):
        b = self.corpo()
        email = (b.get("email") or "").strip().lower()
        with lock:
            d = ler()
            u = next((x for x in d["usuarios"] if x["email"] == email), None)
            if not u or not confere(b.get("senha") or "", u["senha"]):
                return self.enviar(401, {"erro": "E-mail ou senha incorretos"})
            r = abrir_sessao(d, u)
            gravar(d)
        self.enviar(200, r)

    def colecao(self, nome):
        with lock:
            d = ler()
            token = self.headers.get("Authorization", "").replace("Bearer ", "")
            uid = d["tokens"].get(token)
            if not uid:
                return self.enviar(401, {"erro": "Faça login"})
            if self.command == "POST":
                b = self.corpo()
                item = {c: b.get(c) for c in CAMPOS[nome]}
                if nome == "recargas" and isinstance(b.get("kwh"), dict) and b["kwh"]:
                    item["energia"] = round(sum(b["kwh"].values()), 3)
                    item["custo"] = tarifar(b["kwh"])
                    item["economia"] = round(item["energia"] * PRECOS["rapido"] - item["custo"], 2)
                item.update(id=secrets.token_hex(4), uid=uid, criado=agora())
                d[nome].append(item)
                gravar(d)
                return self.enviar(201, item)
            self.enviar(200, [x for x in d[nome] if x["uid"] == uid])

    def analise(self, rota):
        with lock:
            d = ler()
            token = self.headers.get("Authorization", "").replace("Bearer ", "")
            uid = d["tokens"].get(token)
            nome = next((u["nome"] for u in d["usuarios"] if u["id"] == uid), "")
            sessoes = [Sessao.de_dict(x) for x in d["recargas"] if x["uid"] == uid]
        if not uid:
            return self.enviar(401, {"erro": "Faça login"})
        if rota == "sessoes":
            campo = ORDENAVEIS.get(self.q.get("ordenar"), "criado")
            lista, comp = merge_sort(sessoes, campo, self.q.get("ordem") == "desc")
            return self.enviar(200, {"sessoes": [asdict(s) for s in lista], "algoritmo": "Merge Sort",
                                     "comparacoes": comp, "n": len(lista)})
        if rota == "busca":
            achada, comp = busca_linear(sessoes, self.q.get("recibo", ""))
            return self.enviar(200, {"resultado": asdict(achada) if achada else None,
                                     "comparacoes": comp, "n": len(sessoes)})
        if rota == "estatisticas":
            return self.enviar(200, estatisticas(sessoes))
        self.enviar(200, {"texto": relatorio(sessoes, nome)})

    def demo(self):
        with lock:
            d = ler()
            uid = d["tokens"].get(self.headers.get("Authorization", "").replace("Bearer ", ""))
            if not uid:
                return self.enviar(401, {"erro": "Faça login"})
            carros = [f"{c['modelo']} · {c['placa']}" for c in d["carros"] if c["uid"] == uid]
            novas = gerar_demo(uid, carros)
            d["recargas"] += [asdict(s) for s in novas]
            gravar(d)
        self.enviar(201, {"criadas": len(novas)})

    def log_message(self, *args):
        pass


if __name__ == "__main__":
    print(f"Elevo rodando em http://localhost:{PORTA}  (Ctrl+C para parar)")
    ThreadingHTTPServer(("127.0.0.1", PORTA), Handler).serve_forever()
