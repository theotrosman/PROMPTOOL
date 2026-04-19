from pathlib import Path  
path = Path('src/UsuarioApp.jsx')  
text = path.read_text('utf-8')  
chunk = \" "\n\.join(text.splitlines()[2007:2646])  ; echo print(chunk.count('{'), chunk.count('}'), chunk.count('('), chunk.count(')'))  ; python tmp_syntax_check.py ; del tmp_syntax_check.py
