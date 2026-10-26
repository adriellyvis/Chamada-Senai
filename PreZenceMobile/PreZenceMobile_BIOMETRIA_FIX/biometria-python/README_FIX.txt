CORRECAO IMPORTANTE

Os arquivos .onnx que vieram anteriormente eram ponteiros Git LFS (~130 bytes), não modelos reais.
Nesta versão eles NÃO são empacotados. Rode instalar.bat para baixar os binários oficiais e validar SHA-256.

Depois:
  iniciar.bat

Teste:
  http://localhost:5000/health

No celular:
  http://IP_DO_PC:5000/health

Se aparecer "Reconhecedor indisponível" no app, rode diagnosticar.bat.
