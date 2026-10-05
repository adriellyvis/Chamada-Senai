package prezence.repository;

import prezence.model.BiometriaAmostra;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface BiometriaAmostraRepository
        extends JpaRepository<BiometriaAmostra, Integer> {

    List<BiometriaAmostra>
    findByBiometria_IdOrderByOrdemAmostraAsc(
            Integer biometriaId
    );


    List<BiometriaAmostra>
    findByBiometria_Usuario_IdAndBiometria_AtivoTrueOrderByOrdemAmostraAsc(
            Integer usuarioId
    );


    void deleteByBiometria_Id(
            Integer biometriaId
    );

    @Query("""
        SELECT a
        FROM BiometriaAmostra a
        JOIN FETCH a.biometria b
        JOIN FETCH b.usuario u
        JOIN FETCH u.perfil p
        WHERE b.tipo = :tipo
          AND b.ativo = true
        ORDER BY u.id, a.ordemAmostra
        """)
    List<BiometriaAmostra> listarAmostrasAtivasPorTipo(
            @Param("tipo") String tipo
    );
}