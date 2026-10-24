import random
import secrets
from dataclasses import asdict, dataclass, field
from datetime import datetime, timedelta

PRECOS = {"lento": 1.10, "otimizado": 1.17, "rapido": 1.45}
ORDENAVEIS = {"data": "criado", "energia": "energia", "custo": "custo", "duracao_min": "duracao_min"}


@dataclass
class Sessao:
    id: str = ""
    uid: str = ""
    recibo: str = ""
    data: str = ""
    criado: str = ""
    carro: str = ""
    energia: float = 0.0
    duracao_min: int = 0
    custo: float = 0.0
    estrategia: str = ""
    pagamento: str = ""
    economia: float = 0.0
    kwh: dict = field(default_factory=dict)

    @classmethod
    def de_dict(cls, d):
        return cls(**{k: v for k, v in d.items() if k in cls.__dataclass_fields__})


def tarifar(kwh_por_estrategia):
    total = 0.0
    for estrategia, kwh in kwh_por_estrategia.items():
        if estrategia in PRECOS:
            total += PRECOS[estrategia] * kwh
    return round(total, 2)


def busca_linear(sessoes, recibo):
    comparacoes = 0
    for s in sessoes:
        comparacoes += 1
        if s.recibo == recibo:
            return s, comparacoes
    return None, comparacoes


def merge_sort(lista, campo, decrescente=False):
    comparacoes = [0]

    def antes(a, b):
        comparacoes[0] += 1
        x, y = getattr(a, campo), getattr(b, campo)
        return x >= y if decrescente else x <= y

    def ordenar(v):
        if len(v) <= 1:
            return v
        meio = len(v) // 2
        esq, dir_ = ordenar(v[:meio]), ordenar(v[meio:])
        r, i, j = [], 0, 0
        while i < len(esq) and j < len(dir_):
            if antes(esq[i], dir_[j]):
                r.append(esq[i])
                i += 1
            else:
                r.append(dir_[j])
                j += 1
        return r + esq[i:] + dir_[j:]

    return ordenar(list(lista)), comparacoes[0]


def estatisticas(sessoes):
    n = len(sessoes)
    if n == 0:
        return {"total": 0, "energia_total": 0, "receita": 0, "custo_medio": 0,
                "maior_energia": 0, "economia_total": 0, "estrategia_top": None}
    energia = receita = economia = 0.0
    maior = 0.0
    usos = {}
    for s in sessoes:
        energia += s.energia
        receita += s.custo
        economia += s.economia
        maior = max(maior, s.energia)
        usos[s.estrategia] = usos.get(s.estrategia, 0) + 1
    return {"total": n, "energia_total": round(energia, 2), "receita": round(receita, 2),
            "custo_medio": round(receita / n, 2), "maior_energia": round(maior, 2),
            "economia_total": round(economia, 2), "estrategia_top": max(usos, key=usos.get)}


def relatorio(sessoes, nome):
    e = estatisticas(sessoes)
    return "\n".join([
        f"RELATÓRIO ELEVO — {nome}",
        f"Sessões realizadas: {e['total']}",
        f"Energia total: {e['energia_total']:.2f} kWh",
        f"Valor total cobrado: R$ {e['receita']:.2f}",
        f"Custo médio por sessão: R$ {e['custo_medio']:.2f}",
        f"Maior recarga: {e['maior_energia']:.2f} kWh",
        f"Economia estimada vs modo rápido: R$ {e['economia_total']:.2f}",
        f"Estratégia mais usada: {e['estrategia_top'] or '-'}",
    ])


def gerar_demo(uid, carros, n=10):
    rnd = random.Random()
    agora = datetime.now()
    sessoes = []
    for i in range(n):
        estrategia = rnd.choice(list(PRECOS))
        energia = round(rnd.uniform(6, 45), 2)
        kwh = {estrategia: energia}
        custo = tarifar(kwh)
        quando = agora - timedelta(days=n - i, minutes=rnd.randint(0, 600))
        potencia = rnd.choice([7.4, 11, 22])
        sessoes.append(Sessao(
            id=secrets.token_hex(4), uid=uid, recibo=str(rnd.randint(100000, 999999)),
            data=quando.strftime("%d/%m/%Y %H:%M:%S"), criado=quando.isoformat(timespec="seconds"),
            carro=rnd.choice(carros) if carros else "Veículo demo", energia=energia,
            duracao_min=int(energia / potencia * 60), custo=custo, estrategia=estrategia,
            pagamento=rnd.choice(["Pix", "Cartão", "Carteira digital"]),
            economia=round(energia * PRECOS["rapido"] - custo, 2), kwh=kwh))
    return sessoes
