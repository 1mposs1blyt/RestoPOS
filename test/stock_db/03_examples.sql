-- =====================================================================
--  Полезные запросы, которые потом станут методами бэка
-- =====================================================================

-- 1. Текущие остатки (то, что в iiko колонка "Остаток" в номенклатуре)
SELECT s.name AS store, p.name AS product, u.short_name AS unit,
       b.quantity,
       CASE WHEN b.quantity > 0 THEN round(b.total_cost / b.quantity, 2) END AS avg_cost
FROM stock_balances b
JOIN products p ON p.id = b.product_id
JOIN units u    ON u.id = p.unit_id
JOIN stores s   ON s.id = b.store_id
ORDER BY p.name;

-- 2. Остаток на любую дату — просто сумма движений до неё
SELECT p.name, sum(m.quantity) AS quantity, sum(m.cost_amount) AS cost
FROM stock_movements m
JOIN products p ON p.id = m.product_id
WHERE m.movement_date < '2026-10-12 12:00+03'
GROUP BY p.name;

-- 3. Какая версия техкарты действует на дату (то, что ломалось у тебя в iiko)
SELECT r.id, r.date_from, r.date_to
FROM recipes r
WHERE r.product_id = '30000000-0000-0000-0000-000000000003'
  AND r.date_from <= DATE '2026-10-12'
  AND (r.date_to IS NULL OR r.date_to >= DATE '2026-10-12');

-- 4. Себестоимость порции блюда по текущим средним ценам
SELECT p.name AS dish,
       round(sum(ri.gross / r.portions * b.total_cost / nullif(b.quantity, 0)), 2) AS cost_per_portion
FROM recipes r
JOIN products p        ON p.id = r.product_id
JOIN recipe_items ri   ON ri.recipe_id = r.id
JOIN stock_balances b  ON b.product_id = ri.ingredient_id
WHERE r.date_to IS NULL
GROUP BY p.name;

-- 5. Движения по документу: что именно сделало проведение
SELECT d.type, d.number, p.name, m.quantity, m.cost_amount
FROM stock_movements m
JOIN documents d ON d.id = m.document_id
JOIN products p  ON p.id = m.product_id
ORDER BY m.id;

-- 6. Сверка: остатки в stock_balances должны совпадать с суммой движений.
--    Если запрос что-то вернул — где-то в коде проведения баг.
SELECT b.product_id, b.quantity, coalesce(sum(m.quantity), 0) AS from_movements
FROM stock_balances b
LEFT JOIN stock_movements m ON m.store_id = b.store_id AND m.product_id = b.product_id
GROUP BY b.store_id, b.product_id, b.quantity
HAVING b.quantity <> coalesce(sum(m.quantity), 0);
