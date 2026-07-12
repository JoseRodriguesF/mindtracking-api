export const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[ !"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]).{8,}$/;

export function hasEmoji(value) {
  return /[\p{Extended_Pictographic}]/u.test(value);
}

export function isAsciiOnly(value) {
  const emojiRegex = /\p{Extended_Pictographic}/u;
  const variationSelector = /\uFE0F/;
  return !emojiRegex.test(value) && !variationSelector.test(value);
}

export function validateEmail(email) {
  if (!email || typeof email !== 'string') return "E-mail é obrigatório";
  const trimmed = email.trim();
  if (trimmed.length > 254) return "E-mail muito longo";
  if (/[\s]/.test(trimmed)) return "E-mail não pode conter espaços";
  if (!isAsciiOnly(trimmed)) return "Caracteres inválidos: apenas ASCII (sem emoji)";

  const parts = trimmed.split("@");
  if (parts.length !== 2) return "E-mail deve conter exatamente um '@'";

  const [local, domain] = parts;
  if (!local || !domain) return "Formato de e-mail inválido";
  if (local.length > 64) return "Parte local do e-mail é muito longa";
  if (domain.length > 255) return "Domínio do e-mail é muito longo";

  if (!/^[A-Za-z0-9._%+-]+$/.test(local)) return "Caracteres inválidos na parte local";
  if (local.startsWith(".") || local.endsWith(".")) return "Parte local não pode iniciar/terminar com ponto";
  if (local.includes("..")) return "Parte local não pode conter '..'";

  if (!/^[A-Za-z0-9.-]+$/.test(domain)) return "Caracteres inválidos no domínio";
  if (!domain.includes(".")) return "Domínio deve conter ponto";
  if (domain.includes("..")) return "Domínio não pode conter '..'";

  const labels = domain.split(".");
  if (labels.some(l => l.length === 0)) return "Domínio inválido";
  for (const label of labels) {
    if (label.length < 1 || label.length > 63) return "Cada rótulo do domínio deve ter 1–63 caracteres";
    if (!/^[A-Za-z0-9-]+$/.test(label)) return "Domínio possui caracteres inválidos";
    if (label.startsWith("-") || label.endsWith("-")) return "Rótulos do domínio não podem iniciar/terminar com '-'";
  }

  const tld = labels[labels.length - 1];
  if (!/^[A-Za-z]{2,63}$/.test(tld)) return "TLD inválido (apenas letras, 2–63)";

  return null;
}

export function validatePassword(password, confirm) {
  if (!password || !confirm) return "Preencha todos os campos de senha";
  if (!isAsciiOnly(password)) return "A senha não pode conter emoji";
  if (password.length < 8) return "A senha deve ter no mínimo 8 caracteres";
  if (password.length > 20) return "A senha deve ter no máximo 20 caracteres";
  if (!passwordRegex.test(password))
    return "A senha deve incluir letra maiúscula, minúscula, número e caractere especial";
  if (password !== confirm) return "As senhas não coincidem";
  return null;
}

export function validateBirthdate(birthdate) {
  if (!birthdate || typeof birthdate !== 'string') return "Data de nascimento é obrigatória";
  const trimmed = birthdate.trim();

  // Esperado no formato YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return "Formato inválido. Use YYYY-MM-DD";
  }

  const [year, month, day] = trimmed.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return "Data de nascimento inválida";
  }

  const today = new Date();
  let age = today.getFullYear() - year;

  if (today.getMonth() < month - 1 || 
      (today.getMonth() === month - 1 && today.getDate() < day)) {
    age--;
  }

  if (age < 12) return "Você deve ter pelo menos 12 anos";
  if (age > 70) return "Idade máxima permitida é 70 anos";

  return null;
}

export function validatePhone(phone) {
  if (!phone || typeof phone !== 'string') return "Telefone é obrigatório";
  const trimmed = phone.trim();

  const cleanPhone = trimmed.replace(/\D/g, '');
  if (cleanPhone.length !== 10 && cleanPhone.length !== 11) {
    return "Telefone deve ter 10 ou 11 dígitos (com DDD)";
  }

  const ddd = parseInt(cleanPhone.substring(0, 2), 10);
  if (ddd < 11 || ddd > 99) {
    return "DDD inválido";
  }

  return null;
}

export function validateGender(gender) {
  if (!gender || typeof gender !== 'string') return "Gênero é obrigatório";
  const validGenders = ["masculino", "feminino", "outro", "prefiro não dizer"];
  if (!validGenders.includes(gender.toLowerCase())) {
    return "Selecione um gênero válido";
  }
  return null;
}

export function validateName(name) {
  if (!name || typeof name !== 'string') return "Nome é obrigatório";
  const trimmed = name.trim();
  if (hasEmoji(name)) return "O nome não pode conter emoji";
  if (trimmed.length < 2) return "Nome muito curto (mínimo 2 caracteres)";
  if (trimmed.length > 150) return "Nome muito longo (máximo 150 caracteres)";
  if (!/^[\p{L}\p{M}\s'-]+$/u.test(trimmed)) return "Nome contém caracteres inválidos";
  return null;
}
