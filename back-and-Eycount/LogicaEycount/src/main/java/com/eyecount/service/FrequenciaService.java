package com.eyecount.service;

import com.eyecount.dto.frequencia.FrequenciaAlunoDTO;
import com.eyecount.model.Aluno;
import com.eyecount.model.Presenca;
import com.eyecount.model.StatusPresenca;
import com.eyecount.repository.AlunoRepository;
import com.eyecount.repository.PresencaRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class FrequenciaService {
    private final AlunoRepository alunoRepository;
    private final PresencaRepository presencaRepository;

    public FrequenciaService(
            AlunoRepository alunoRepository,
            PresencaRepository presencaRepository
    ) {
        this.alunoRepository = alunoRepository;
        this.presencaRepository = presencaRepository;
    }

    public List<FrequenciaAlunoDTO> calcularPorTurma(
            Integer turmaId
    ) {
        List<Aluno> alunos = alunoRepository.findByTurmaId(turmaId);
        List<FrequenciaAlunoDTO> lista = new ArrayList<>();

        for (Aluno aluno : alunos) {
            List<Presenca> presencas = presencaRepository.findByAluno_Id(aluno.getId());

            int totalAulas = presencas.size();
            int presentes = (int) presencas.stream().filter(p -> p.getStatus() == StatusPresenca.PRESENTE).count();

            double frequencia = 0;

            if (totalAulas > 0) {
                frequencia = (presentes * 100.0) / totalAulas;
            }

            String risco;

            if (frequencia < 50) {
                risco = "alto";
            } else if (frequencia < 75) {
                risco = "medio";
            } else {
                risco = "baixo";
            }

            lista.add(new FrequenciaAlunoDTO(
                    aluno.getId(),
                    aluno.getUsuario().getNome(),
                    aluno.getMatricula(),
                    totalAulas,
                    presentes,
                    Math.round(frequencia * 10.0) / 10.0,
                    risco
                    )
            );
        }

        return lista;
    }
}