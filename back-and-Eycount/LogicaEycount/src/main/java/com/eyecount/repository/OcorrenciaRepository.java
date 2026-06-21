package com.eyecount.repository;

import com.eyecount.model.GravidadeOcorrencia;
import com.eyecount.model.Ocorrencia;
import com.eyecount.model.StatusOcorrencia;
import com.eyecount.model.TipoOcorrencia;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OcorrenciaRepository extends JpaRepository<Ocorrencia, Integer> {

    List<Ocorrencia> findByAluno_Id(Integer alunoId);

    List<Ocorrencia> findByProfessor_Id(Integer professorId);

    List<Ocorrencia> findByStatus(StatusOcorrencia status);

    List<Ocorrencia> findByTipo(TipoOcorrencia tipo);

    Long countByStatus(StatusOcorrencia status);

    Long countByGravidade(GravidadeOcorrencia gravidade);

    List<Ocorrencia> findTop10ByOrderByDataOcorrenciaDesc();
}