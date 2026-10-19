package prezence.repository;

import prezence.model.Disciplina;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
public interface DisciplinaRepository extends JpaRepository<Disciplina, Integer> {
    //Busca registros aplicando os filtros descritos no metodo findByNome
    Optional<Disciplina> findByNome(String nome);

    // Busca registros aplicando os filtros descritos no metodo findByNomeIgnoreCase.
    Optional<Disciplina> findByNomeIgnoreCase(String nome);

    Optional<Disciplina> findBySiglaIgnoreCase(
            String sigla
    );
}
