# cli/add_stock.py
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

import click
from sqlalchemy.orm import Session
from database import SessionLocal
from model import Stock
from datetime import date
from decimal import Decimal


@click.group()
def cli():
    """모의투자 종목 관리 CLI"""
    pass


@cli.command("add")
@click.option("--code", "-c", required=True, help="종목코드")
@click.option("--name", "-n", required=True, help="종목명")
@click.option("--price", "-p", type=float, required=True, help="상장 초기 가격")
@click.option("--listing-date", "-d", help="상장일 (YYYY-MM-DD)")
@click.option("--description", help="종목 설명")
def add_stock(code: str, name: str, price: float, listing_date: str | None, description: str | None):
    """새 종목 상장"""
    db: Session = SessionLocal()

    if db.query(Stock).filter(Stock.code == code.upper()).first():
        click.echo(click.style(f"❌ 이미 등록된 종목입니다: {code}", fg="red"))
        db.close()
        return

    try:
        listing_date_obj = date.fromisoformat(listing_date) if listing_date else None
    except ValueError:
        click.echo(click.style("❌ 상장일 형식이 잘못되었습니다.", fg="red"))
        db.close()
        return

    initial_price = Decimal(str(price))

    new_stock = Stock(
        code=code.upper(),
        name=name,
        market="KOSPI",
        asset_type="STOCK",
        listing_date=listing_date_obj,
        description=description,
        is_active=True,
        last_price=initial_price,
        prev_close=initial_price,
        change_rate=Decimal("0"),
        volume=0,
        market_cap=0
    )

    db.add(new_stock)
    db.commit()
    db.refresh(new_stock)

    click.echo(click.style("✅ 종목 상장 완료!", fg="green", bold=True))
    click.echo(f"   코드 : {new_stock.code} | 이름 : {new_stock.name} | 가격 : {new_stock.last_price:,}원")
    db.close()


@cli.command("update")
@click.option("--code", "-c", required=True, help="수정할 종목코드")
@click.option("--name", "-n", help="새 종목명")
@click.option("--price", "-p", type=float, help="새 현재가 (last_price)")
@click.option("--listing-date", "-d", help="새 상장일 (YYYY-MM-DD)")
@click.option("--description", help="새 설명")
@click.option("--active", is_flag=True, help="활성화")
@click.option("--inactive", is_flag=True, help="비활성화")
def update_stock(code: str, name: str | None, price: float | None, 
                 listing_date: str | None, description: str | None, 
                 active: bool, inactive: bool):
    """종목 정보 수정"""
    db: Session = SessionLocal()

    stock = db.query(Stock).filter(Stock.code == code.upper()).first()
    if not stock:
        click.echo(click.style(f"❌ 종목을 찾을 수 없습니다: {code}", fg="red"))
        db.close()
        return

    updated = False

    if name:
        stock.name = name
        updated = True
    if price is not None:
        stock.last_price = Decimal(str(price))
        stock.prev_close = stock.prev_close or stock.last_price  # prev_close가 없으면 업데이트
        stock.change_rate = Decimal("0")
        updated = True
    if listing_date:
        try:
            stock.listing_date = date.fromisoformat(listing_date)
            updated = True
        except ValueError:
            click.echo(click.style("❌ 상장일 형식이 잘못되었습니다.", fg="red"))
    if description:
        stock.description = description
        updated = True
    if active:
        stock.is_active = True
        updated = True
    if inactive:
        stock.is_active = False
        updated = True

    if updated:
        db.commit()
        db.refresh(stock)
        click.echo(click.style("✅ 종목 정보 수정 완료!", fg="green", bold=True))
        click.echo(f"   코드 : {stock.code}")
        click.echo(f"   이름 : {stock.name}")
        click.echo(f"   가격 : {stock.last_price:,}원")
        click.echo(f"   상태 : {'🟢 활성' if stock.is_active else '🔴 비활성'}")
    else:
        click.echo("ℹ️  수정된 내용이 없습니다.")

    db.close()


@cli.command("add-batch")
@click.argument("filename", type=click.Path(exists=True))
def add_batch(filename: str):
    """CSV로 대량 상장"""
    import csv
    db: Session = SessionLocal()
    added = 0
    skipped = 0

    try:
        with open(filename, 'r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            for row in reader:
                code = (row.get('code') or row.get('종목코드') or '').strip()
                name = (row.get('name') or row.get('종목명') or '').strip()
                price_str = row.get('price') or row.get('상장가격') or row.get('last_price')

                if not code or not name or not price_str:
                    continue

                if db.query(Stock).filter(Stock.code == code.upper()).first():
                    skipped += 1
                    continue

                stock = Stock(
                    code=code.upper(),
                    name=name,
                    market="KOSPI",
                    asset_type="STOCK",
                    listing_date=date.fromisoformat(row['listing_date']) if row.get('listing_date') else None,
                    last_price=Decimal(price_str),
                    prev_close=Decimal(price_str),
                    change_rate=Decimal("0"),
                    is_active=True
                )
                db.add(stock)
                added += 1

        db.commit()
        click.echo(click.style(f"✅ 대량 상장 완료! 추가: {added}개, 건너뜀: {skipped}개", fg="green", bold=True))
    except Exception as e:
        db.rollback()
        click.echo(click.style(f"❌ 오류: {e}", fg="red"))
    finally:
        db.close()


@cli.command("list")
def list_stocks():
    """등록된 종목 목록"""
    db: Session = SessionLocal()
    stocks = db.query(Stock).order_by(Stock.code).all()

    click.echo(click.style(f"\n📋 등록된 종목 총 {len(stocks)}개\n", fg="blue", bold=True))
    for s in stocks:
        status = "🟢" if s.is_active else "🔴"
        price = f"{s.last_price:,}" if s.last_price else "-"
        click.echo(f"{status} {s.code:12} | {s.name:25} | {price:12}원")
    db.close()


if __name__ == "__main__":
    cli()