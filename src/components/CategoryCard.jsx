function CategoryCard({ category, totalParejas = 0 }) {
  return (
    <article className="category-card">
      <div>
        <p className="eyebrow">{category.nivel}</p>
        <h3>{category.nombre}</h3>
      </div>
      <p>{category.descripcion}</p>
      <span>{totalParejas} parejas inscritas</span>
    </article>
  )
}

export default CategoryCard
