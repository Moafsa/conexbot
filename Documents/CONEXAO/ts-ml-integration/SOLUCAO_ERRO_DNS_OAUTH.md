# 🔧 Solução para Erro DNS ao Conectar Conta

## ❌ Erro Encontrado

Ao clicar em "Conectar Conta", você pode ver o erro:
- **"Não é possível acessar esse site"**
- **"DNS_PROBE_FINISHED_NXDOMAIN"**
- O navegador não consegue acessar `auth.mercadolivre.com.br`

## 🔍 Causa do Problema

Este erro **NÃO é um problema do plugin**, mas sim um problema de **rede/DNS** no seu computador ou rede. O plugin está gerando a URL correta, mas seu navegador não consegue resolver o DNS do Mercado Livre.

## ✅ Soluções

### Solução 1: Verificar Conexão com Internet

1. Verifique se você está conectado à internet
2. Tente acessar https://www.mercadolivre.com.br diretamente no navegador
3. Se não conseguir acessar, o problema é de conexão geral

### Solução 2: Alterar DNS

O problema pode ser com o servidor DNS que você está usando. Tente usar um DNS público:

**Windows:**
1. Abra o **Painel de Controle**
2. Vá em **Rede e Internet > Centro de Rede e Compartilhamento**
3. Clique na sua conexão de rede
4. Clique em **Propriedades**
5. Selecione **Protocolo TCP/IP versão 4 (TCP/IPv4)**
6. Clique em **Propriedades**
7. Marque **"Usar os seguintes endereços de servidor DNS"**
8. Digite:
   - **DNS preferencial:** `8.8.8.8` (Google DNS)
   - **DNS alternativo:** `8.8.4.4` (Google DNS)
9. Clique em **OK** e reinicie o navegador

**Ou use Cloudflare DNS:**
- **DNS preferencial:** `1.1.1.1`
- **DNS alternativo:** `1.0.0.1`

### Solução 3: Limpar Cache DNS

**Windows (PowerShell como Administrador):**
```powershell
ipconfig /flushdns
```

**Windows (CMD como Administrador):**
```cmd
ipconfig /flushdns
```

Depois, reinicie o navegador.

### Solução 4: Verificar Firewall/Antivírus

1. Verifique se seu **firewall** ou **antivírus** não está bloqueando o acesso ao Mercado Livre
2. Tente desativar temporariamente o firewall/antivírus e testar novamente
3. Se funcionar, adicione uma exceção para o navegador

### Solução 5: Verificar Proxy/VPN

1. Se você está usando **VPN** ou **Proxy**, tente desativar temporariamente
2. Alguns proxies podem bloquear o acesso ao Mercado Livre
3. Teste sem VPN/Proxy

### Solução 6: Testar em Outro Navegador

1. Tente usar outro navegador (Chrome, Firefox, Edge)
2. Se funcionar em outro navegador, o problema pode ser configuração do navegador atual

### Solução 7: Verificar Hosts File

**Windows:**
1. Abra o Bloco de Notas **como Administrador**
2. Abra o arquivo: `C:\Windows\System32\drivers\etc\hosts`
3. Verifique se há alguma linha bloqueando `mercadolivre.com.br` ou `auth.mercadolivre.com.br`
4. Se houver, remova ou comente a linha (adicione `#` no início)
5. Salve o arquivo

### Solução 8: Testar em Outra Rede

1. Tente conectar usando outra rede (ex: hotspot do celular)
2. Se funcionar em outra rede, o problema é na sua rede atual
3. Contate o administrador da rede se necessário

## 🧪 Como Testar se o DNS Está Funcionando

Abra o **Prompt de Comando** ou **PowerShell** e execute:

```cmd
ping auth.mercadolivre.com.br
```

**Se funcionar**, você verá algo como:
```
Pinging auth.mercadolivre.com.br [xxx.xxx.xxx.xxx] with 32 bytes of data:
Reply from xxx.xxx.xxx.xxx: bytes=32 time=XXms TTL=XX
```

**Se não funcionar**, você verá:
```
Ping request could not find host auth.mercadolivre.com.br. Please check the name and try again.
```

## 📝 Verificações no Plugin

O plugin agora mostra mensagens mais claras:

1. **Se o App ID não estiver configurado**, você verá:
   - "⚠️ Erro: App ID não configurado para este país"

2. **Se houver erro na conexão**, você verá:
   - "⚠️ Erro na Conexão: [mensagem de erro]"

3. **Ao clicar em "Conectar Conta"**, você verá:
   - Uma mensagem explicando que será redirecionado
   - Um aviso sobre possíveis erros de DNS

## ✅ Após Resolver o Problema

1. Recarregue a página de configurações (F5)
2. Clique novamente em "Conectar Conta"
3. Você será redirecionado para o Mercado Livre
4. Autorize a aplicação
5. Você será redirecionado de volta e a conta estará conectada

## 🆘 Ainda Não Funciona?

Se nenhuma das soluções acima funcionar:

1. Verifique se o Mercado Livre está funcionando normalmente:
   - Acesse https://www.mercadolivre.com.br
   - Se não conseguir, o problema é geral do Mercado Livre

2. Verifique se há manutenção no Mercado Livre:
   - Acesse https://status.mercadolivre.com.br (se existir)

3. Tente novamente mais tarde:
   - Pode ser um problema temporário do Mercado Livre

4. Entre em contato com o suporte do Mercado Livre:
   - Se o problema persistir, pode ser necessário contatar o suporte

## 📌 Nota Importante

O erro `DNS_PROBE_FINISHED_NXDOMAIN` **NÃO é causado pelo plugin**. O plugin está funcionando corretamente e gerando a URL OAuth correta. O problema é que seu computador/rede não consegue resolver o DNS do Mercado Livre.
