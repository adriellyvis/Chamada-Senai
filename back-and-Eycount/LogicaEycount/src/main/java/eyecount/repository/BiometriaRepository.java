package eyecount.repository;

import eyecount.model.Biometria;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
/*
 * Repository de Biometria. Repository Spring Data responsavel pelas consultas e operacoes
 * de banco desta entidade.
 */

public interface BiometriaRepository extends JpaRepository<Biometria, Integer> {
    /*
     * Busca registros aplicando os filtros descritos no metodo findByUsuario_IdAndTipo.
     */
    Optional<Biometria> findByUsuario_IdAndTipo(Integer usuarioId, String tipo);
    /*
     * Busca registros aplicando os filtros descritos no metodo findByAtivoTrue.
     */
    List<Biometria> findByAtivoTrue();
}
