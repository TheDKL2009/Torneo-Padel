function CategoryCard({ category, totalParejas = 0, participantCountLabel = 'parejas inscritas' }) {
  return (
    <article className="category-card">
      <div>
        <p className="eyebrow">{category.nivel}</p>
        <h3>{category.nombre}</h3>
      </div>
      <p>{category.descripcion}</p>
      <span>{totalParejas} {participantCountLabel}</span>
    </article>
  )
}

export default CategoryCard
