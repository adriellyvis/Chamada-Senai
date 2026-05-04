package com.eyecount.repository;

import com.eyecount.dto.AlertaEvasaoDTO;
import com.eyecount.model.Presenca;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface PresencaRepository extends JpaRepository<Presenca, Integer> {
    Optional<Presenca> findByAluno_IdAndAula_Id(Integer alunoId, Integer aulaId);

    List<Presenca> findByAula_Id(Integer aulaId);

    @Query("""
    SELECT new com.eyecount.dto.AlertaEvasaoDTO(
        a.id,
        a.usuario.nome,
        a.matricula,
        ROUND(
            (SUM(CASE WHEN p.status = 'presente' THEN 1 ELSE 0 END) * 100.0) / COUNT(p.id),
            1
        ),
        CASE
            WHEN ((SUM(CASE WHEN p.status = 'presente' THEN 1 ELSE 0 END) * 100.0) / COUNT(p.id)) < 50 THEN 'alto'
            ELSE 'medio'
        END
    )
    FROM Presenca p
    JOIN p.aluno a
    GROUP BY a.id, a.usuario.nome, a.matricula
    HAVING ((SUM(CASE WHEN p.status = 'presente' THEN 1 ELSE 0 END) * 100.0) / COUNT(p.id)) < 75
""")
    List<AlertaEvasaoDTO> buscarAlertasEvasao();
}