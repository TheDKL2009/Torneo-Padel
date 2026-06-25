function CategoryCard({ category, totalParticipantes = 0 }) {
  return (
    <article className="category-card">
      <div>
        <p className="eyebrow">{category.nivel}</p>
        <h3>{category.nombre}</h3>
      </div>
      {category.descripcion && <p>{category.descripcion}</p>}
      <span className="category-card__count">{totalParticipantes} participantes inscritos</span>
    </article>
  )
}

export default CategoryCard
