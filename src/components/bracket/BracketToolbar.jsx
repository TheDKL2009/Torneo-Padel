function BracketToolbar({ categorias, categoriaId, cuadroTipo, onCategoriaChange, onCuadroTipoChange }) {
  return (
    <div className="filters bracket-toolbar">
      <label>
        Categoria
        <select value={categoriaId} onChange={(event) => onCategoriaChange(event.target.value)}>
          <option value="">Selecciona categoria</option>
          {categorias.map((categoria) => (
            <option key={categoria.id} value={categoria.id}>
              {categoria.nombre}
            </option>
          ))}
        </select>
      </label>
      <label>
        Tipo de cuadro
        <select value={cuadroTipo} onChange={(event) => onCuadroTipoChange(event.target.value)}>
          <option value="principal">Cuadro principal</option>
          <option value="consolacion">Consolacion</option>
        </select>
      </label>
    </div>
  )
}

export default BracketToolbar
