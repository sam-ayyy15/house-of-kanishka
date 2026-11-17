import styles from '@/components/admin/Admin.module.css';
import { ProductRow } from '@/components/admin/ProductRow';
import { requireAdmin } from '@/lib/admin-gate';
import { adminDb } from '@/lib/supabase/server';

/** Every piece (on sale or not): its price, whether it is on sale, and the stock of each size. */
export default async function AdminStockPage() {
  await requireAdmin('/admin/stock');
  const db = adminDb();
  const [products, variants] = await Promise.all([
    db.from('products').select('id, slug, name, category_slug, price_inr, status, sort_order').order('category_slug').order('sort_order'),
    db.from('product_variants').select('id, product_id, size, stock, sort_order').order('sort_order'),
  ]);
  const rows = (products.data ?? []).map((p) => ({
    ...p,
    variants: (variants.data ?? []).filter((v) => v.product_id === p.id).map((v) => ({ id: v.id, size: v.size, stock: v.stock })),
  }));

  const categories = [...new Set(rows.map((p) => p.category_slug))];

  return (
    <>
      <header className={styles.head}>
        <h1 className={styles.title}>Stock</h1>
        <p className={styles.sub}>Stock is what is on the shelf now. Orders take from it by themselves; the shop shows changes within a minute.</p>
      </header>
      <div>
        {categories.map((category) => {
          const pieces = rows.filter((p) => p.category_slug === category);
          return (
            <section key={category}>
              <header className={styles.group}>
                <h2 className={styles.groupTitle}>{category}</h2>
                <p className={styles.muted}>
                  {pieces.length} {pieces.length === 1 ? 'piece' : 'pieces'}
                </p>
              </header>
              {pieces.map((p, i) => (
                <ProductRow key={p.id} product={p} index={Math.min(i, 10)} />
              ))}
            </section>
          );
        })}
      </div>
    </>
  );
}
