package prezence.repository;

import prezence.model.Biometria;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BiometriaRepository extends JpaRepository<Biometria, Integer> {
    // Busca registros aplicando os filtros descritos no metodo findByUsuario_IdAndTipo.
    Optional<Biometria> findByUsuario_IdAndTipo(Integer usuarioId, String tipo);

    // Busca registros aplicando os filtros descritos no metodo findByAtivoTrue.
    List<Biometria> findByAtivoTrue();


}
