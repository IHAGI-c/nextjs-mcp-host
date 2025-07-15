import i18n from './i18n';

// 번역 함수 (i18n 인스턴스 사용)
export function translate(key: string, options?: any): string {
  return i18n.t(key, options) as string;
}

// 현재 언어 가져오기
export function getCurrentLanguage(): string {
  return i18n.language;
}

// 언어 변경하기
export async function changeLanguage(language: string): Promise<void> {
  localStorage.setItem('language', language);
  await i18n.changeLanguage(language);
}

// 지원되는 언어 목록
export const supportedLanguages = [
  { code: 'en', name: 'English' },
  { code: 'ko', name: '한국어' },
];

// 언어 코드로 언어 이름 가져오기
export function getLanguageName(code: string): string {
  const language = supportedLanguages.find((lang) => lang.code === code);
  return language ? language.name : code;
}

// 중첩된 키를 사용한 번역
export function translateNested(key: string, options?: any): string {
  return i18n.t(key, options) as string;
}

// 복수형 번역
export function translatePlural(
  key: string,
  count: number,
  options?: any,
): string {
  return i18n.t(key, { count, ...options }) as string;
}

// 번역 키 존재 여부 확인
export function translationExists(key: string): boolean {
  return i18n.exists(key);
}
