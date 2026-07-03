# Restaurar do Backup (se algo quebrar após o pull)

**Backup criado em:** `/root/conexbot-backup-20260318-144755`  
**Data:** 18/03/2025

## Situação atual
- Projeto atualizado para o GitHub (commit: `638897c` - fix webhook e audio)
- Backup completo do estado anterior está em `/root/conexbot-backup-20260318-144755`

## Se algo não funcionar e quiser restaurar

### Opção 1: Restaurar TUDO (voltar ao estado exato do backup)
```bash
rm -rf /root/conexbot
cp -a /root/conexbot-backup-20260318-144755 /root/conexbot
```

### Opção 2: Restaurar só os arquivos que mudaram (copiar diferenças)
```bash
# Listar arquivos diferentes entre backup e atual
diff -rq /root/conexbot-backup-20260318-144755/Documents /root/conexbot/Documents 2>/dev/null | grep "differ"

# Sobrescrever com os arquivos do backup (restaura as versões que funcionavam)
rsync -av /root/conexbot-backup-20260318-144755/Documents/CONEXAO/ /root/conexbot/Documents/CONEXAO/
```

### Opção 3: Restaurar um arquivo específico
```bash
cp /root/conexbot-backup-20260318-144755/Documents/CONEXAO/caminho/do/arquivo /root/conexbot/Documents/CONEXAO/caminho/do/arquivo
```

## Remover o backup (quando não precisar mais)
```bash
rm -rf /root/conexbot-backup-20260318-144755
```
