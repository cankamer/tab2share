# Tab2Share — Ürün Tanımı & Geliştirme Promptu

**Sürüm:** v1.7
**Tarih:** 14 Eylül 2026
**Lisans:** GPL-3.0
**Durum:** Tüm v1 kararları alındı, geliştirmeye hazır

---

## 1. Tek Cümlelik Özet

Tab2Share, gitaristlerin çaldıkları riff/solo/akor dizilimlerini ritimli tab olarak yazıp, reel ve shorts videolarının üzerine bindirilebilecek **alfa kanallı PNG** olarak dışa aktarmasını sağlayan, açık kaynak bir Windows masaüstü uygulamasıdır.

## 2. Problem

Gitaristler sosyal medyada çalış videosu paylaşırken izleyicinin "bunu nasıl çalıyor?" sorusuna cevap veremiyor. Mevcut tab yazılımları (Guitar Pro, TuxGuitar) nota yazımı için tasarlanmış, sosyal medya çıktısı üretmek için değil. Ekran görüntüsü alıp kırpmak zahmetli ve sonuç kötü görünüyor.

## 3. Hedef Kullanıcı

- Instagram Reels / TikTok / YouTube Shorts'ta çalış videosu paylaşan gitaristler
- Kendi riff'ini öğreten içerik üreticileri
- Not: Kullanıcı profesyonel nota bilgisine sahip olmayabilir. Arayüz gitar perdesi mantığıyla çalışmalı, solfej bilgisi zorunlu olmamalı.

## 4. Teknoloji Yığını (KARAR)

| Katman | Seçim |
|---|---|
| Uygulama kabuğu | Tauri v2 |
| Arayüz | React + TypeScript |
| Tab çizimi | Canvas 2D (HTML5) |
| Ses | Web Audio API (v2) |
| Stil | Tailwind CSS |
| Dosya erişimi | Tauri fs + dialog plugin |
| Çokdillilik | i18next |
| Paketleme | Tauri bundler (.msi / .exe) |
| Lisans | **GPL-3.0** |

**Gerekçe:** Tek dilde (TypeScript) geliştirme, Rust tarafına neredeyse hiç dokunulmuyor. Kurulum boyutu ~10 MB. Alfa kanallı PNG dışa aktarımı `canvas.toBlob()` ile doğrudan mümkün.

**Lisans gerekçesi:** GPL-3.0, kodu alıp kapalı kaynak ücretli sürüm çıkarmayı engeller. Tab2Share bir kütüphane değil son kullanıcı uygulaması olduğu için GPL'in kütüphanelerde yarattığı uyumluluk sorunları burada geçerli değil.

**Bağımlılık:** Windows'ta WebView2 gerekli (Win10/11'de yüklü gelir).

## 5. Veri Modeli (KARAR — projenin çekirdeği)

Tab bir görsel değil, **zamanlı müzik verisi** olarak saklanır. Çizim ve export bu modelden türetilir.

```ts
type Duration = 1 | 2 | 4 | 8 | 16 | 32;   // whole, half, quarter, 8th, 16th, 32nd

type BendPreset =
  | 'half'        // ½ ton
  | 'full'        // 1 ton
  | 'oneAndHalf'  // 1½ ton
  | 'bendRelease' // bük ve bırak
  | 'preBend'     // önceden bükülü çal
  | 'preBendRelease';

type SlideType =
  | 'legato'      // s  — vurmadan kaydır
  | 'shift'       // /  — hedef perde belirli
  | 'inFromBelow' // alttan gelerek
  | 'inFromAbove'
  | 'outUp'       // yukarı kayıp biter
  | 'outDown';

interface Note {
  string: 1 | 2 | 3 | 4 | 5 | 6;   // 1 = ince mi (e), 6 = kalın mi (E)
  fret: number;                     // 0-24
  bend?: BendPreset;
  slide?: { type: SlideType; targetFret?: number };
  vibrato?: 'normal' | 'wide';
  hammer?: boolean;                 // yön otomatik hesaplanır (h veya p)
  dead?: boolean;                   // ölü nota, "x" olarak basılır
  ghost?: boolean;                  // parantez içinde basılır
}

interface Beat {
  duration: Duration;
  dotted: boolean;
  isRest: boolean;
  notes: Note[];                            // birden fazla nota = akor/çift ses
  chordRef?: string;                        // "Am", "C7" — üstte etiket olarak basılır
  tuplet?: { count: number; over: number }; // triole vb.
  palmMute?: boolean;                       // beat seviyesinde, aralık olarak çizilir
  letRing?: boolean;
}

interface Measure {
  beats: Beat[];
  timeSignature?: { num: number; den: number }; // sadece değiştiğinde yazılır
  tempo?: number;                                // sadece değiştiğinde yazılır
  repeatStart?: boolean;
  repeatEnd?: number;                            // tekrar sayısı
  sectionLabel?: string;                         // "Verse", "Chorus"
}

interface Track {
  tuning: string[];        // ["E","A","D","G","B","E"] — drop D vb. için değişebilir
  capo: number;
  measures: Measure[];
}

interface Project {
  version: string;
  title: string;
  artist?: string;
  defaultTempo: number;
  defaultTimeSignature: { num: number; den: number };
  track: Track;
  renderTheme: RenderTheme;
}
```

**Kritik kural:** Ölçü içindeki sürelerin toplamı zaman işaretine uymalı. Editör bunu doğrulamalı ve eksik/taşan ölçüyü görsel olarak uyarmalı, ama yazmayı engellememeli.

## 6. Ritim Modeli (KARAR)

- Nota süreleri, es'ler, noktalı notalar, trioleler desteklenir
- Ölçü çizgileri ve zaman işareti (varsayılan 4/4)
- Tempo (BPM), varsayılan 120
- Ritim, tab satırının **altında sap ve bayraklarla** gösterilir (Guitar Pro standardı)
- Bu model sayesinde playback, satır kırma ve ileride animasyonlu export neredeyse bedava gelir

## 7. Efekt Sistemi (KARAR)

### Referans araştırması

| | Guitar Pro 8 | TuxGuitar |
|---|---|---|
| Uygulama şekli | Nota seç → efekt uygula | Nota seç → efekt uygula |
| Erişim | Kısayol tuşu + kenar paleti + menü | Efekt kutusu + araç çubuğu |
| Bend | Grafik eğri editörü + preset'ler, çeyrek ton hassasiyet, maks 3 ton | Preset listesi + ince ayar diyaloğu |
| Vibrato | Hafif / geniş ayrımı | Parametresiz, sadece aç/kapa |
| Slide | Legato ve shift ayrı, ayrıca "içeri/dışarı" varyantları | Tek tip slide |
| Kısıt | — | Aynı notaya slide ve bend birlikte uygulanamaz |

### Tab2Share kararı

**Bend'de grafik eğri editörü YOK (v1).** O editör playback için var, sesin eğrisini şekillendirmek için. Bizim v1 çıktımız statik PNG olduğundan ara kırılma noktaları ekranda hiçbir görsel fark yaratmıyor. Bunun yerine **5 görsel preset butonu** kullanıcının ihtiyacının neredeyse tamamını karşılar. Eğri editörü, playback ile birlikte v2'ye.

**Kısayollar Guitar Pro ile birebir aynı.** Sektörde ezberlenmiş tuşlar, sıfır maliyetle kazanılan kullanılabilirlik.

### v1 efekt seti

| Efekt | Kısayol | Tab'da görünüm | Parametre |
|---|---|---|---|
| Bend | `B` | Yukarı ok + miktar (`full`, `½`, `1½`) | 5 preset |
| Vibrato | `V` / `Alt+V` | Nota üstünde dalga (`〜`) | normal / geniş |
| Slide | `S` / `Alt+S` | `/` veya `\` | 6 tip |
| Hammer-on / Pull-off | `H` | `h` veya `p` yayı | yön otomatik |
| Ölü nota | `X` | `x` | yok |
| Palm mute | `[` | `PM- - - -` parantezi | aralık |
| Let ring | `I` | `let ring - - -` | aralık |
| Ghost nota | `O` | `(5)` | yok |

**Otomatik davranış:** Hammer/pull uygulandığında yön hesaplanır. Aynı teldeki sonraki nota daha yüksek perdedeyse `h`, düşükse `p` basılır. Kullanıcı ayrım yapmak zorunda kalmaz.

**Çakışma kuralı:** Aynı notaya bend ve slide birlikte uygulanamaz (gerçek gitarda da uygulanamaz). Kullanıcı denerse ikincisi birincinin yerini alır, sessizce değil, kısa bir uyarı ile.

### v2'ye ertelenenler
Bend eğri editörü, trill, tremolo bar / whammy, tapping, doğal ve yapay harmonikler, süsleme notaları (grace note), tremolo picking.

### Erişim yolları (üçü paralel)
1. **Kısayol tuşu** — hızlı kullanıcı için
2. **Efekt paleti** — gitar klavyesinin yanında ikon şeridi, keşfedilebilirlik için
3. **Sağ tık menüsü** — nota üzerinde bağlam menüsü

## 8. Proje Dosyası ve Menü (KARAR)

### Dosya formatı
- Uzantı: **`.t2s`**, içerik JSON (`Project` nesnesinin serileştirilmiş hali)
- İnsan tarafından okunabilir ve git ile versiyonlanabilir olmalı
- `version` alanı ileri sürümlerde göç (migration) için zorunlu

### Akış
1. Uygulama açılışında: **Yeni Proje** / **Proje Aç** / son açılanlar listesi
2. Yeni proje oluştururken kullanıcı **dosya konumunu seçer** (Tauri dialog plugin)
3. Konum seçildikten sonra **otomatik kayıt** devreye girer
4. Başlıkta kaydedilmemiş değişiklik göstergesi (`*`)

### Menü çubuğu (KARAR)

Beş sekme: `File`, `Edit`, `Note`, `View`, `Help`. Native Windows menüsü değil, React ile çizilir, böylece tasarım diliyle uyumlu kalır.

`Alt` tuşu ile menü klavyeden açılır (`Alt+F` dosya menüsü, vb.). Uygulanamaz durumdaki öğeler soluk gösterilir ve üzerine gelindiğinde nedeni yazar.

#### File
| Öğe | Kısayol |
|---|---|
| New project | `Ctrl+N` |
| Open... | `Ctrl+O` |
| Recent files ▸ | son 10 dosya |
| ─ | |
| Save | `Ctrl+S` |
| Save as... | `Ctrl+Shift+S` |
| ─ | |
| Export PNG... | `Ctrl+E` |
| Copy PNG to clipboard | `Ctrl+Shift+C` |
| ─ | |
| Project settings... | başlık, sanatçı, tempo, zaman işareti, akort, capo |
| ─ | |
| Exit | `Alt+F4` |

#### Edit
| Öğe | Kısayol |
|---|---|
| Undo | `Ctrl+Z` |
| Redo | `Ctrl+Y` (ayrıca `Ctrl+Shift+Z`) |
| ─ | |
| Cut | `Ctrl+X` |
| Copy | `Ctrl+C` |
| Paste | `Ctrl+V` |
| Delete | `Delete` |
| Select all | `Ctrl+A` |
| ─ | |
| Insert measure | `Ctrl+M` |
| Duplicate measure | `Ctrl+D` |
| Delete measure | `Ctrl+Shift+M` |
| ─ | |
| Transpose up / down | `Ctrl+↑` / `Ctrl+↓` |
| ─ | |
| Preferences... | `Ctrl+,` |

#### Note
Efektlerin kısayolları var ama menüde görünmezlerse keşfedilmezler. Bu menü hem erişim hem öğretim işlevi görür.

| Öğe | Kısayol |
|---|---|
| Duration ▸ | `F1`-`F6`, noktalı `.`, triole `T` |
| Rest | `R` |
| ─ | |
| Bend ▸ (½, full, 1½, bend/release, pre-bend) | `B` |
| Vibrato | `V` |
| Wide vibrato | `Alt+V` |
| Slide ▸ (legato, shift, in, out) | `S` / `Alt+S` |
| Hammer-on / pull-off | `H` |
| ─ | |
| Dead note | `X` |
| Ghost note | `O` |
| Palm mute | `[` |
| Let ring | `I` |
| ─ | |
| Clear effects | `Ctrl+Shift+X` |

#### View
| Öğe | Kısayol |
|---|---|
| Zoom in / out | `Ctrl++` / `Ctrl+-` |
| Reset zoom | `Ctrl+0` |
| ─ | |
| Toggle preview | `Ctrl+P` |
| Toggle fretboard | `Ctrl+B` |
| Toggle chord picker | `Ctrl+K` |
| Toggle effect palette | `Ctrl+J` |
| ─ | |
| Measures per line ▸ | Auto, 1-8 |
| ─ | |
| Theme ▸ | Light / Dark / System |
| Language ▸ | Türkçe / English |

#### Help
| Öğe | Kısayol |
|---|---|
| Getting started | |
| Keyboard shortcuts | `Ctrl+/` |
| Tab notation guide | bend, slide, vibrato sembolleri ne anlama geliyor |
| ─ | |
| Report an issue | GitHub'a yönlendirir |
| Source code | GitHub'a yönlendirir |
| ─ | |
| Check for updates | |
| About Tab2Share | sürüm, lisans, katkıda bulunanlar |

#### Kısayol sekmesi tasarımı

`Help > Keyboard shortcuts` bir modal panel açar.

- Üstte arama kutusu, yazdıkça canlı filtreler. "bend" yazınca sadece bend ile ilgili satırlar kalır
- Kategorilere ayrılmış: Gezinme, Nota girişi, Efektler, Düzenleme, Dosya, Görünüm
- **Tuşlar fiziksel tuş kapağı olarak çizilir.** Bölüm 10.1'deki `.raised` gölge reçetesi kullanılır. Arayüzün tasarım dili zaten bu, kısayol listesi de ona uyar
- Alt tarafta not: kısayollar v1'de değiştirilemez

#### F1 çakışması

`F1`-`F6` nota süresine atandığı için **`F1` yardım açmaz.** Windows kullanıcısının alışkanlığına ters düşen bilinçli bir tercihtir; nota yazarken süre değiştirmek, yardım açmaktan çok daha sık yapılan bir iştir. Yardım `Ctrl+/` üzerindedir ve bu, kısayol panelinin kendisinde ilk sırada gösterilir.

## 9. Editör Yerleşimi (KARAR)

```
┌──────────────────────────────────────────────────┐
│  File  Edit  View  Help                          │
├──────────────────────────────────────────────────┤
│  ÜST ÇUBUK: tempo | zaman işareti | akort | capo │
│             süre seçici: ♩ ♪ ♬ . ³               │
├──────────────────────────────────────────────────┤
│  TAB LINE (6 telli, ölçü çizgili, yatay kaydır)  │
│      Am              C                            │
│  e|--0-----------|---0--------------              │
│  B|--1-----------|---1--------------              │
│  G|--2-----------|---0--------------              │
│  D|--2-----------|---2--------------              │
│  A|--0-----------|---3--------------              │
│  E|--------------|-------------------             │
│     ♩  ♪ ♪  ♩     |   ritim sapları               │
├──────────────┬──────────────────┬────────────────┤
│ AKOR SEÇİCİ  │ GİTAR KLAVYESİ   │ EFEKT PALETİ   │
│ C Am G Em Dm │ 6 tel × 24 perde │ ↗ 〜 / h x PM  │
│ F D E A7 ... │ tıkla → nota ekle│ tıkla → uygula │
└──────────────┴──────────────────┴────────────────┘
```

**Akor seçici:** Sabit 30 akorluk kütüphane (bkz. bölüm 9.1). Seçilen akor tab'a **hem perde dizilimi hem de üstte akor ismi** olarak eklenir.

**Gitar klavyesi:** Gerçek gitar perdesi görünümü, tıklayarak tek tek nota girişi. Seçili akordun notaları klavye üzerinde vurgulanır.

**Nota girişi akışı:** Aktif süre (♩/♪/♬) seçilir, sonra perdeye tıklanır. Süre bir sonraki değişikliğe kadar geçerli kalır.

### 9.1 Akor Kütüphanesi (KARAR)

Sabit 30 akor. Kullanıcı kendi akorunu tanımlayamaz (v2). Gerekçe: kullanıcı tanımlı akor, voicing doğrulama ve otomatik isimlendirme gibi bir dizi kenar durum getirir, MVP'de karşılığı yoktur. Sabit set olduğu için akorlar doğrudan kod içinde veri olarak tutulur.

Dizilimler **6. telden 1. tele** (kalın mi → ince mi) yazılmıştır. `x` = çalınmayan tel.

| # | Akor | Dizilim | # | Akor | Dizilim |
|---|---|---|---|---|---|
| 1 | C | x32010 | 16 | D7 | xx0212 |
| 2 | A | x02220 | 17 | E7 | 020100 |
| 3 | G | 320003 | 18 | G7 | 320001 |
| 4 | E | 022100 | 19 | Am7 | x02010 |
| 5 | D | xx0232 | 20 | Dm7 | xx0211 |
| 6 | F | 133211 | 21 | Em7 | 022030 |
| 7 | B | x24442 | 22 | Cmaj7 | x32000 |
| 8 | Am | x02210 | 23 | Gmaj7 | 320002 |
| 9 | Em | 022000 | 24 | Asus2 | x02200 |
| 10 | Dm | xx0231 | 25 | Asus4 | x02230 |
| 11 | Bm | x24432 | 26 | Dsus2 | xx0230 |
| 12 | Cm | x35543 | 27 | Dsus4 | xx0233 |
| 13 | Gm | 355333 | 28 | Esus4 | 022200 |
| 14 | A7 | x02020 | 29 | E5 | 022xxx |
| 15 | B7 | x21202 | 30 | A5 | x022xx |

**Not:** Veri modelinde `Note.string` 1 = ince mi olduğu için, bu tablodaki diziler koda aktarılırken ters çevrilmelidir. Tek bir yardımcı fonksiyonda yapılmalı, her yerde elle değil.

**Arayüz (v1.6'da revize edildi):** Akorlar kategoriye göre sekmelenir (Majör / Minör / 7'li / Sus / Power), ancak seçim mekanizması artık dairesel bir **çark** (bkz. bölüm 10.1 "Akor seçici / nota çarkı") — akorlar merkez etrafında dilim olarak dizilir, üzerine gelince akor diyagramı önizlemesi çıkar. Bu bileşen bölüm 13'teki nota çarkıyla aynı temel bileşendir, v2'de nota moduna geçebilir.

### 9.2 Akort ve Capo (KARAR)

**Alternatif akortlar MVP'de.** Hazır setler: Standart (EADGBe), Drop D, Drop C, DADGAD, Open G, Open D, Half Step Down. Kullanıcı ayrıca her teli tek tek ayarlayabilir.

**Capo MVP'de.** Capo tab rakamlarını değiştirmez, yalnızca duyulan perdeyi kaydırır. Bu yüzden v1'de capo sadece bir metadata'dır: tab'ın başında `Capo 2` etiketi olarak basılır. Playback geldiğinde (v2) transpoze hesabına dahil olur.

**Standart dışı akortta akor seçici (KARAR):** Kütüphane çalışmaya devam eder, dizilim olduğu gibi tab'a eklenir. Ancak akor etiketinin yanında küçük bir uyarı işareti belirir ve üzerine gelindiğinde şu mesaj çıkar:

> Bu dizilim standart akort için hesaplanmıştır. Drop D akordunda basılan ses farklı olabilir, akor ismini kontrol et.

Kullanıcı isterse akor etiketini elle düzeltebilir. Gerekçe: kullanıcı ne yaptığını biliyorsa engellenmemeli, sadece bilgilendirilmelidir. Doğru akor ismini hesaplayan motor v2'ye bırakılmıştır.


### 9.3 Klavyeden Nota Girişi (KARAR)

Sadece perdeye tıklayarak nota girmek yavaştır. Asıl hız klavyeden gelir.

#### Gezinme
| Tuş | İşlev |
|---|---|
| `←` `→` | Sütunlar (beat) arası gezin |
| `↑` `↓` | Teller arası gezin, aynı sütunda kal |
| `Home` / `End` | Ölçü başı / sonu |
| `Insert` | Araya boş beat ekle |
| `R` | Seçili süre kadar es ekle |
| `Delete` | Notayı sil, beat yerinde kalır |
| `Ctrl+Delete` | Beat'i tamamen sil, sonrası sola kayar |

> `Space` bilinçli olarak boş bırakılmıştır, v2'de playback'e atanacaktır.

#### Nota süresi
`F1`-`F6` doğrudan süre seçer: `F1` birlik, `F2` ikilik, `F3` dörtlük, `F4` sekizlik, `F5` onaltılık, `F6` otuzikilik. `.` noktalı yapar, `T` triole yapar. Seçili süre bir sonraki değişikliğe kadar geçerli kalır.

#### Perde girişi: aralık kuralı (KARAR)

Zamanlayıcı **kullanılmaz.** İki basamaklı perde belirsizliği, perde aralığının kendisinden çözülür. Gitarda 0-24 perde vardır:

| Yazılan ilk rakam | Davranış |
|---|---|
| `0` | Devamı olamaz → anında kesinleşir |
| `1` | 10-19 olabilir → ikinci rakam beklenir |
| `2` | 20-24 olabilir → ikinci rakam beklenir |
| `3`-`9` | 30+ perde yok → anında kesinleşir |

Bekleme durumundaki bir notayı, ikinci rakam yazmadan kesinleştirmek için herhangi bir rakam dışı tuşa basmak yeterlidir (ok tuşu, süre tuşu, `Enter`).

Sonuç: perdelerin çoğunda tek tuşa basılıp geçilir, yalnızca `1` ve `2` için bir ek tuş gerekir. Belirsizlik yok, zamanlayıcı yok, yavaş yazan kullanıcı cezalandırılmaz.

#### Otomatik ilerleme (toggle)

Araç çubuğunda açılıp kapanan bir anahtar. Varsayılan **açık**.

- **Açık:** Nota kesinleştiği anda imleç bir sonraki sütuna geçer. Aynı sütunda akor kurmak için `Shift + rakam` kullanılır, imleç yerinde kalır.
- **Kapalı:** İmleç asla kendiliğinden hareket etmez. Yalnızca ok tuşu veya fare tıklaması ile geçilir. (Guitar Pro davranışı.)

#### Görsel geri bildirim (zorunlu)

- Aktif sütun, tab boyunca uzanan dikey bir bantla vurgulanır
- Aktif hücrede imleç görünür
- **Bekleme durumundaki rakam, kenarlıklı bir kutu içinde gösterilir.** Kullanıcı sistemin ikinci rakamı beklediğini görmelidir, yoksa kural görünmez ve kafa karıştırıcı olur

### 9.4 Düzenleme Mekanikleri (KARAR)

#### Seçim
- Tek nota: tıkla veya ok tuşlarıyla git
- **Aralık seçimi (MVP'de):** `Shift + ok` ile veya fareyle sürükleyerek birden fazla beat/ölçü seçilir
- Seçili aralık kopyalanabilir, kesilebilir, silinebilir, yapıştırılabilir

#### Ölçü işlemleri
Sağ tık menüsünden ve `Edit` menüsünden erişilir:
- Araya ölçü ekle
- Ölçüyü sil
- **Ölçüyü çoğalt** — riff yazarken en sık kullanılacak işlem
- Zaman işareti değiştir (bu ölçüden itibaren)
- Tempo değiştir (bu ölçüden itibaren)

#### Transpoze (MVP'de)
Tüm tab yarım ton yukarı veya aşağı kaydırılır. Perde numaraları aynı tel üzerinde kayar.

**Sınır kuralı:** Herhangi bir nota 0'ın altına veya 24'ün üstüne taşacaksa **işlem tamamen iptal edilir** ve kullanıcıya hangi ölçüde takıldığı söylenir. Kısmi uygulama yapılmaz. Gerekçe: yarısı kaymış bir tab sessizce bozulmuş demektir, kullanıcı bunu fark etmeyebilir.

#### Undo / Redo
Her atomik işlem bir adımdır. Geçmiş sınırsızdır ve dosya kaydedildiğinde silinmez.


## 10. Görsel Dil ve Tema (KARAR)

**Kritik ayrım: iki ayrı tema sistemi var.** Uygulamanın kendi görünümü ile export edilen tab'ın görünümü birbirinden tamamen bağımsızdır.

### 10.1 Uygulama teması — neumorphism (KARAR, v1.6'da revize edildi)

**Karar değişikliği:** Geliştirme sırasında modern skeuomorphism'den **tam neumorphism**'e geçildi. Ahşap/deri gibi doku sorunu zaten yoktu, ama artık metalik gradyan, knob gölgesi gibi "fiziksel obje taklidi" öğeleri de kalkıyor. Yeni dil: aynı yüzey rengi üzerinde yalnızca yumuşak çift gölgeyle şekillenen, neredeyse tek renkli bir arayüz.

**Kesin kurallar (devam ediyor):**
- Ahşap, deri, kağıt, yıpranma efekti **yok**
- Neon, parlama (glow), cyan/magenta vurgu **yok**
- Metalik gradyan, parlak highlight çizgisi **yok** (skeuomorphism'den kalan, artık geçersiz)
- Gövde tamamen akromatik. Tek renk vurgu kırmızı, sadece kayıt, aktif imleç ve odak halkası için
- Işık kaynağı her zaman sol üstten. Her yüzey iki gölgeyle tanımlanır: sol üstte açık gölge, sağ altta koyu gölge. Basılınca ikisi yer değiştirir (inset)

#### Renk paleti

Neumorphism'de yüzey ve arka plan **aynı renk**, ayrım tamamen gölgeden gelir.

**Aydınlık mod**
```css
--body:          #E6E7EA;  /* tüm yüzeyler bu renk, gölge ile ayrışır */
--shadow-light:  #FFFFFF;  /* sol üst, kabarık görünüm */
--shadow-dark:   #B8BAC0;  /* sağ alt, kabarık görünüm */
--screen:        #171717;  /* ekran paneli, tek istisna */
--screen-line:   #232323;
--screen-text:   #F2F2F2;
--label:         #6B6B6B;
--accent:        #D4372B;  /* kayıt, aktif imleç, odak halkası, uyarı */
```

**Karanlık mod**
```css
--body:          #2C2D30;
--shadow-light:  #38393D;
--shadow-dark:   #1E1F21;
--screen:        #0C0C0C;
--screen-line:   #161616;
--screen-text:   #EDEDED;
--label:         #9A9A9A;
--accent:        #E04638;
```

#### Gölge reçeteleri (neumorphic çift gölge)

Tüm stil bu üç reçeteden türer. Elle yeni gölge uydurulmaz.

```css
/* Kabarık yüzey: buton, panel, fret hücresi */
.raised {
  background: var(--body);
  box-shadow:
    -6px -6px 12px var(--shadow-light),
     6px  6px 12px var(--shadow-dark);
}

/* Basılı / seçili durum — gölgeler içe döner */
.raised:active,
.raised.is-active {
  box-shadow:
    inset -4px -4px 8px var(--shadow-light),
    inset  4px  4px 8px var(--shadow-dark);
}

/* Gömme kuyu: ekran alanı, oluk, her zaman inset */
.inset {
  box-shadow:
    inset -4px -4px 8px var(--shadow-light),
    inset  4px  4px 8px var(--shadow-dark);
}
```

#### Kontrol dili (neumorphic)

| Bileşen | Görünüm |
|---|---|
| Buton | `.raised`, düz `--body` renginde, ikon veya metin ortalı. Basılınca `.raised:active` |
| Knob (tempo, hız) | Dairesel `.raised`, üzerinde ince gösterge çizgisi `--accent` renginde |
| Toggle | Hap şeklinde `.inset` oluk, içinde kayan `.raised` topuz |
| Durum hapı | `.inset` küçük oluk içinde metin, örn. `120 BPM`, `4/4`, `Capo 2` |
| Fret hücresi | Dairesel `.raised` chip, basılı/aktif tel `.raised:active` + `--accent` kenarlık |
| Hoparlör ızgarası | Nokta deseni, her nokta minik `.inset` çukur |
| Vurgu | Kırmızı (`--accent`) çizgi veya kenarlık, yalnızca aktif/seçili/kayıt durumunda |

#### Akor seçici / nota çarkı — birleşik bileşen (KARAR)

Akor seçici, dairesel bir çark olarak tasarlanır: akorlar merkez etrafında dilim/tekerlek konuşmacıları (spoke) gibi dizilir, merkezde seçili akorun adı görünür, üzerine gelince akor diyagramı önizlemesi çıkar.

**Bu bileşen, bölüm 13'teki "Nota Çarkı" ile aynı temel bileşendir.** v1'de akor modunda çalışır (30 akor, dilimler akor isimleri), v2'de nota moduna geçilebilir (12 dilim, nota isimleri, tıklanınca ses çalar, akor patternleri gösterilir). Tek bir `Wheel` bileşeni, farklı veri kaynağı ve etkileşim moduyla iki işlevi de karşılar. Ayrı ayrı iki bileşen yazılmaz.

#### Ekran metaforu (değişmedi)

Tab canvas'ı hâlâ istisna: koyu, gömme bir panel (`.inset`), üzerinde hafif tarama çizgisi dokusu, açık renkte çizilen tab, kırmızı imleç çizgisi. Neumorphism gövdeye uygulanır, ekrana değil — ekran hâlâ "cihazın dijital yüzü" olarak ayrı bir dil konuşur.

#### Erişilebilirlik uyarısı (GÜÇLENDİRİLDİ — kritik)

**Neumorphism, tasarım camiasında en çok eleştirilen erişilebilirlik sorununa sahip akımlardan biridir.** Yüzey ve arka plan aynı renk olduğu için ayrım tamamen gölgeye dayanır, bu da düşük görüşlü kullanıcılar için ve düşük parlaklıklı ekranlarda neredeyse görünmez hale gelebilir. Bu proje açık kaynak ve geniş bir kullanıcı kitlesine ulaşmayı hedeflediği için aşağıdaki kurallar **zorunludur, opsiyonel değildir:**

- Hiçbir buton yalnızca gölgeyle ayırt edilemez. Her tıklanabilir öğenin metin rengi, ikonu veya ince bir kenarlığı olmalı, "düz renkli kabarık blob" olarak bırakılmamalı
- Aktif/seçili durum gölgeden bağımsız ikinci bir sinyal taşır: kırmızı vurgu rengi veya net kenarlık
- Metin kontrastı her koşulda WCAG AA sağlanır, gölgeye güvenilmez
- Klavye odağı (`:focus-visible`) için yüksek kontrastlı kırmızı halka zorunludur, zaten uygulanmış durumda — bu kural korunmalı
- Butonun basılabilir alanı görsel gölge sınırından değil, gerçek hedef boyutundan (min. 40×40px) belirlenir

### 10.2 Tab render teması — temiz ve okunaklı

Export edilen PNG **skeuomorfik olmamalı.** Reel videosunun üstüne bindiği için tek önceliği yüksek kontrast ve net çizgidir. Ahşap doku orada okunurluğu öldürür.

Kullanıcının değiştirebileceği renkler **yalnızca tab içeriğine** aittir:

```ts
interface RenderTheme {
  chordLabelColor: string;   // akor yazıları (Am, C7)
  bendArrowColor: string;    // bend okları
  articulationColor: string; // vibrato dalgası, slide çizgisi, h/p
  fretNumberColor: string;   // perde rakamları
  stringLineColor: string;   // tel çizgileri
  rhythmStemColor: string;   // ritim sapları
  edgeFade: { enabled: boolean; ratio: number }; // kenar opaklık geçişi
}
```

Hazır paletler sunulur (örn. beyaz-üzeri-koyu-video, siyah-üzeri-açık-video, neon), kullanıcı üzerinde oynayabilir.

## 11. Çokdillilik (KARAR)

- Türkçe ve İngilizce, dil seçici ile
- i18next, tüm metinler `tr.json` / `en.json` içinde
- İlk açılışta Windows sistem dilinden otomatik tahmin, kullanıcı `View > Language` ile değiştirir
- Kod içinde hiçbir sabit metin (hardcoded string) bulunmaz

## 12. Ana Modlar

### 12.1 Sandbox Modu
Tam serbest çalışma alanı. Tüm araçlar açık, uygulama kullanıcıya hiçbir şey dayatmaz, öneri sunmaz.

### 12.2 Şarkı Oluştur Modu (v2)
Onboarding ile kullanıcının müzik tarzı ve akor yürüyüşü bilgisi alınır, tab yazarken müzik teorisine dayalı öneriler sunulur:
- Bu tarzda bu akordan sonra hangi akor gelebilir
- Bu akor üzerinde hangi gam/pattern kullanılabilir

> Not: Müzikte yaratıcılıkta sınırlama olmaz. Uygulama yalnızca **öneri** verir, asla zorlamaz.

## 13. Nota Çarkı (v2)

**Bu bölüm, bölüm 9.1/10.1'deki akor seçici çarkıyla aynı bileşenin ikinci modudur** (KARAR, v1.6). v1'de akor seçici olarak (30 akor, dilimler akor isimleri) çalışan `Wheel` bileşeni, v2'de nota moduna geçirilir:
- Her dilim bir notayı temsil eder (A, B, C, D, E...)
- Tıklanınca notanın sesi duyulur
- Aynı çark üzerinde akor patternleri görülebilir

Ayrı bir bileşen yazılmaz, mevcut çark bileşenine veri kaynağı ve etkileşim modu parametresi eklenir.

## 14. Dışa Aktarma (Export)

- **Format:** PNG, alfa kanallı (şeffaf arka plan)
- **Kullanım:** CapCut / Premiere / InShot gibi editörlerde reel videosunun üzerine overlay
- **İki mod:**
  1. **Tek uzun şerit** — örn. 4320 × 480 px, tek satır
  2. **Reel karesi** — 1080 × 1920 px, ölçü sınırlarından 4 satıra kırılarak
- Satır kırma her zaman **ölçü sınırından**, ölçü ortasından asla
- Ölçeklenebilir çözünürlük (1x / 2x / 3x)

### Satır başına ölçü sayısı (KARAR)

**Varsayılan otomatik, kullanıcı geçersiz kılabilir.**

Otomatik algoritma: her ölçü için gereken genişlik, içindeki beat sayısı ve sembol yoğunluğuna (akor etiketi, bend oku, palm mute aralığı) göre hesaplanır. Ölçüler satır genişliği bütçesi dolana kadar eklenir, taşınca yeni satıra geçilir. Satır sonunda kalan boşluk, ölçüler arasında orantılı dağıtılır (justify).

Kullanıcı `Görünüm > Satır başına ölçü` ayarından 1-8 arası sabit bir değer seçebilir. Sabit değerde ölçüler eşit genişlikte çizilir.
- Canlı önizleme paneli, export öncesi sonucu gösterir

### Uzun tab'lar: çoklu PNG (KARAR)

Tab, reel karesindeki 4 satıra sığmayacak kadar uzunsa **otomatik küçültme yapılmaz.** Okunabilirlik her şeyden önce gelir, 480 px yüksekliğindeki bir satırda perde rakamları zaten sınırdadır. Bunun yerine çıktı birden fazla PNG'ye bölünür.

- İsimlendirme: `{proje_adi}_part1.png`, `{proje_adi}_part2.png`, ...
- Bölme noktası her zaman ölçü sınırı
- Export diyaloğunda kaç parça çıkacağı önceden gösterilir
- **Opsiyonel parça göstergesi:** görselin köşesinde küçük `1/3` etiketi. Varsayılan kapalı, kullanıcı açabilir.

### Başlık bloğu (KARAR)

Export edilen görselin üstünde opsiyonel bir bilgi bloğu. **Her öğe ayrı bir onay kutusudur ve varsayılan olarak hepsi kapalıdır.** Kullanıcı hiçbirini açmazsa görselde başlık hiç görünmez.

Seçilebilir öğeler: şarkı adı, sanatçı, akor dizisi (örn. `Am - C - G - F`), tempo, zaman işareti, akort, capo.

**Yerleşim:** En az bir öğe açıksa iki satırlı düzen kullanılır. Şarkı adı büyük punto ile üst satırda, diğer meta bilgiler küçük punto ile alt satırda tire ile ayrılmış olarak. Şarkı adı kapalıysa tek satıra iner.

**Satır kırma motoruna etkisi (önemli):** Başlık bloğu açıkken reel karesinde tab'a kalan alan 4 satırdan 3 satıra düşer. Layout motoru kullanılabilir satır sayısını başlık yüksekliğine göre hesaplamalı, sabit 4 varsaymamalıdır.

### Panoya kopyalama (KARAR)

`Ctrl+Shift+C` görseli dosyaya yazmadan doğrudan panoya kopyalar. Export diyaloğundaki ayarlar (boyut modu, ölçek, başlık bloğu, etiket) aynen geçerlidir.

**Alfa kanalı uyarısı:** Windows panosunda şeffaflık garanti değildir. PNG formatını okuyan uygulamalar (Photoshop, Figma, Discord) alfa kanalını korur; eski `DIB` formatını okuyan uygulamalar şeffaf alanı siyah veya beyaz doldurabilir. Bu yüzden panoya hem PNG hem DIB formatı yazılmalı, ve arayüzde küçük bir not bulunmalıdır: şeffaflık kritikse dosyaya export etmek daha güvenlidir.

### Tab2Share etiketi (KARAR)

Export edilen görselin köşesinde küçük, düşük opaklıklı bir Tab2Share etiketi bulunur. **Varsayılan açık**, kullanıcı export ayarlarından kapatabilir. Zorunlu değildir, kapatmak için ücret veya hesap gerekmez.

## 15. Kapsam Dışı (v1 ve sonrası)

Bu liste, geliştirme sırasında kapsamın kaymasını engellemek için vardır. Aşağıdakiler **yapılmayacaktır**, iyi fikir oldukları için değil, bu ürünün işi olmadıkları için.

- **Çok parçalı düzenleme.** Tek gitar parçası. Bas, davul, ikinci gitar, vokal yok.
- **Solfej (standart nota) görünümü.** Sadece tab. Hedef kullanıcı nota okumuyor.
- **Ses kaydı ve mixer.** Uygulama ses kaydetmez, efekt zinciri sunmaz.
- **Bulut senkronizasyonu, hesap sistemi, paylaşım platformu.** Dosyalar kullanıcının diskindedir, hepsi bu.
- **Video düzenleme.** Reel'i biz kurgulamıyoruz, sadece üzerine konacak katmanı üretiyoruz.
- **Guitar Pro dosya formatı yazma.** İleride okuma eklenebilir (v3), yazma hiç planlanmıyor.
- **Mobil ve macOS sürümü.** v1 yalnızca Windows.
- **Eklenti sistemi.**

Bu maddelerden biri gerçekten gerekli hale gelirse karar günlüğüne yeni bir satır olarak eklenir, sessizce kapsama alınmaz.

## 16. İlk Açılış Deneyimi

Uygulama ilk açıldığında boş bir editör göstermez. Boş editör, kullanıcının ne yapacağını bilmediği bir ekrandır.

Bunun yerine üç seçenekli bir karşılama ekranı:

1. **Yeni proje** — dosya konumu sorulur, editör açılır
2. **Proje aç** — dosya seçici
3. **Örnek projeyi aç** — hazır kısa bir riff yüklenir

Üçüncüsü en önemlisi. Kullanıcı hiçbir şey yazmadan, uygulamanın ne ürettiğini görür: tab ekranda, önizleme sağda, export bir tık uzakta. Örnek proje basit bir Am-C-G-F yürüyüşü ve birkaç bend içermeli ki efektlerin nasıl göründüğü de anlaşılsın.

İlk kez editöre girildiğinde üç adımlık kısa bir ipucu dizisi gösterilir: nota nasıl eklenir, efekt nasıl uygulanır, nasıl export edilir. Atlanabilir ve bir daha gösterilmez.

## 17. Veri Güvenliği ve Hata Durumları

### Çökme kurtarma
Otomatik kayıt, proje dosyasının yanına ayrı bir kurtarma dosyası yazar (`{proje}.t2s.recovery`). Uygulama düzgün kapandığında bu dosya silinir.

Açılışta kurtarma dosyası bulunursa kullanıcıya sorulur: kurtarılan sürümü aç, veya son kaydedilmiş sürümü aç. Karar verilene kadar hiçbir dosyanın üzerine yazılmaz.

### Bozuk dosya
`.t2s` dosyası açılamıyorsa uygulama çökmez. Hata mesajı dosya yolunu ve sorunun ne olduğunu söyler, ham JSON içeriğini görüntüleme seçeneği sunar. Kullanıcı en azından verisini kurtarabilir.

### Sürüm uyuşmazlığı
Dosyanın `version` alanı uygulamadan yeniyse: salt okunur açılır ve güncelleme önerilir. Eskiyse: göç (migration) uygulanır, ilk kayıttan önce kullanıcı bilgilendirilir.

### Dosya ilişkilendirme
`.t2s` uzantısı uygulamaya bağlanır, çift tıklayarak açılır. Dosya sürükleyip uygulama penceresine bırakmak da projeyi açar.

## 18. Performans Hedefleri

Canvas tabanlı bir editörde performans sonradan eklenmez, baştan kurulur.

- **Sanallaştırma:** Yalnızca görünür ölçüler çizilir. 200 ölçülük bir tab'da bile kaydırma akıcı kalmalıdır
- **Kısmi yeniden çizim:** Bir nota değiştiğinde tüm canvas değil, ilgili ölçü yeniden çizilir
- **Hedef:** 60 fps kaydırma, tuş vuruşundan ekranda görünmesine kadar 16 ms altı gecikme
- **Export:** 4320 px genişliğindeki bir şerit 3x ölçekte 1 saniyenin altında üretilmeli

Tuş vuruşu gecikmesi özellikle önemli. Hızlı yazan bir kullanıcıda 50 ms bile fark edilir ve uygulamayı "ağır" hissettirir.

## 19. Dağıtım, Güncelleme ve Gizlilik

### Dağıtım
GitHub Releases üzerinden `.msi` kurulum dosyası. Kaynak koddan derleme talimatları README'de.

### Kod imzalama uyarısı (bilinen kısıt)
İmzalanmamış bir Windows uygulaması indirildiğinde SmartScreen "Windows bilgisayarınızı korudu" uyarısı verir ve kullanıcı ek bir tık yapmak zorunda kalır. Kod imzalama sertifikası yıllık ücretlidir ve açık kaynak bir proje için ciddi bir maliyettir.

Karar: v1'de imzalanmaz. Bunun yerine README'de uyarı açıkça anlatılır ve her sürüm için SHA-256 özeti yayınlanır, kullanıcı dosyayı doğrulayabilir. Proje ilgi görürse sertifika alınması değerlendirilir.

### Güncelleme
`Help > Check for updates` GitHub Releases API'sine bakar, yeni sürüm varsa kullanıcıya söyler ve indirme sayfasına yönlendirir. **Sessiz otomatik güncelleme yoktur.** Kullanıcının makinesine haberi olmadan yazılım indirilmez.

### Gizlilik
**Telemetri, analytics, kullanım takibi yoktur.** Uygulama tek bir durumda internete çıkar: kullanıcı güncelleme kontrolüne tıkladığında. Bu da kapatılabilir. Hiçbir proje verisi cihazdan ayrılmaz.

Bu, README'de ve `Help > About` ekranında açıkça yazılır.

## 20. Yol Haritası

### v1 (MVP)
- [ ] Veri modeli
- [ ] `.t2s` proje dosyası, kaydet / aç / otomatik kayıt
- [ ] File / Edit / Note / View / Help menü çubuğu
- [ ] Kısayol paneli (aranabilir, tuş kapağı görselli)
- [ ] Tab line editörü (6 tel, ölçü, ritim sapları)
- [ ] Gitar klavyesinden nota girişi + süre seçimi
- [ ] 30 akorluk sabit kütüphane, isim + perde dizilimi ile ekleme
- [ ] Alternatif akortlar + capo
- [ ] Otomatik satır kırma + kullanıcı geçersiz kılma
- [ ] Klavyeden nota girişi (aralık kuralı + otomatik ilerleme)
- [ ] Aralık seçimi, kopyala/kes/yapıştır
- [ ] Ölçü işlemleri (ekle, sil, çoğalt)
- [ ] Transpoze
- [ ] Export başlık bloğu
- [ ] Panoya kopyalama
- [ ] Karşılama ekranı + örnek proje
- [ ] Çökme kurtarma
- [ ] Dosya ilişkilendirme ve sürükle-bırak
- [ ] Güncelleme kontrolü
- [ ] v1 efekt seti (bend preset, vibrato, slide, h/p, ölü nota, palm mute, let ring, ghost)
- [ ] Alfa kanallı PNG export (iki boyut modu + çoklu parça)
- [ ] Canlı önizleme
- [ ] Skeuomorfik arayüz, karanlık/aydınlık
- [ ] Tab render tema paletleri
- [ ] Türkçe / İngilizce
- [ ] Undo / Redo

### v2
- [ ] Playback (Web Audio sentez) + metronom
- [ ] Bend eğri editörü
- [ ] Trill, tremolo bar, tapping, harmonikler, grace note
- [ ] Kullanıcı tanımlı akor
- [ ] Nota çarkı
- [ ] Şarkı Oluştur modu
- [ ] Sesten otomatik tab çıkarma (yalnızca mono/tek sesli)

### v3+
- [ ] Animasyonlu/kayan video çıktısı
- [ ] Guitar Pro / MusicXML içe aktarma
- [ ] MIDI cihaz desteği

## 21. Karar Günlüğü

| # | Karar | Gerekçe |
|---|---|---|
| 1 | Çıktı: alfa kanallı PNG | Video editöründe overlay, video üretimi gereksiz karmaşıklık |
| 2 | Giriş: manuel editör (klavye + akor seçici) | Ana kullanım senaryosu, en düşük teknik risk |
| 3 | Sesten tab çıkarma v2'ye | Mono için klasik DSP yeterli, polifonik için ML gerekir |
| 4 | Tauri v2 + React + TS | Tek dil, küçük binary, alfa PNG ve Web Audio yerleşik |
| 5 | Tam ritim modeli | Playback, satır kırma ve animasyonlu export'un ön koşulu |
| 6 | Akor hem isim hem perde dizilimi | Hem okunabilirlik hem çalınabilirlik |
| 7 | İki export boyutu | Farklı paylaşım senaryoları, tek layout motorundan |
| 8 | `.t2s` + konum seçimi + otomatik kayıt | Veri kaybı riski kabul edilemez |
| 9 | Klasik masaüstü menü çubuğu | Kullanıcı alışkanlığı, keşfedilebilirlik |
| 10 | Playback v2'ye | MVP'yi hafifletmek |
| 11 | GPL-3.0 | Kapalı kaynak ticari fork'u engeller |
| 12 | Türkçe + İngilizce | Yerel kullanıcı + uluslararası açık kaynak katkısı |
| 13 | Modern skeuomorphism (ahşap/deri/neon yok), temiz render teması | Uygulamada karakter, çıktıda okunabilirlik |
| 14 | Kullanıcı renk ayarı sadece tab içeriğine | Kapsamı dar tutarak hem basitlik hem tutarlılık |
| 15 | Guitar Pro kısayolları birebir | Sektör ezberi, sıfır maliyetli kullanılabilirlik |
| 16 | Bend'de eğri editörü yok, 5 preset | Statik PNG'de eğri görsel fark yaratmıyor |
| 17 | Sabit 30 akor, kullanıcı tanımı yok | Voicing doğrulama ve otomatik isimlendirme kenar durumlarından kaçınmak |
| 18 | Uzun tab çoklu PNG'ye bölünür, küçültülmez | 480 px satırda okunabilirlik zaten sınırda |
| 19 | Alternatif akort + capo MVP'de | Gitaristlerin büyük kısmı standart dışı akort kullanıyor |
| 20 | Capo v1'de sadece etiket | Tab rakamlarını etkilemiyor, playback gelene kadar hesap gerekmiyor |
| 21 | Tab2Share etiketi varsayılan açık, kapatılabilir | Organik tanıtım, ama kullanıcıya dayatmadan |
| 22 | Satır kırma otomatik, kullanıcı geçersiz kılabilir | İyi varsayılan + kontrol ihtiyacı olana kaçış yolu |
| 23 | Standart dışı akortta akor eklenir, isim için uyarılır | Kullanıcı bilerek yapıyorsa engellenmemeli |
| 24 | Akromatik palet + tek kırmızı vurgu | Referans tasarım dili, renk kararı yükünü sıfırlar |
| 25 | Tab canvas'ı "cihazın ekranı" olarak tasarlanır | Gövde/ekran ayrımı tüm arayüzü hizaya sokuyor |
| 26 | Başlık bloğu öğeleri ayrı onay kutusu, hepsi varsayılan kapalı | Çoğu tab tam 4 satır alan kullanabilsin |
| 27 | Perde girişinde zamanlayıcı yok, aralık kuralı var | Duraksama cezalandırılmamalı, belirsizlik kalmamalı |
| 28 | Otomatik ilerleme toggle, varsayılan açık | Hız isteyene hız, kontrol isteyene kontrol |
| 29 | `Delete` notayı, `Ctrl+Delete` beat'i siler | Yanlış nota düzeltirken ritim bozulmamalı |
| 30 | Transpoze sınır taşmasında tamamen iptal | Kısmi uygulama tab'ı sessizce bozar |
| 31 | Ayrı `Note` menüsü | Efektler menüde görünmezse keşfedilmiyor |
| 32 | Kısayol paneli aranabilir, tuşlar fiziksel kapak olarak çizilir | Uzun liste taranmaz, aranır; tasarım diliyle tutarlılık |
| 33 | `F1` nota süresi kalır, yardım `Ctrl+/` | Süre değiştirmek, yardım açmaktan çok daha sık yapılan iş |
| 34 | Panoya hem PNG hem DIB yazılır, uyarı gösterilir | Windows panosunda alfa kanalı garanti değil |
| 35 | Açık kapsam dışı listesi | Kapsam kayması en yaygın proje ölüm nedeni |
| 36 | Karşılama ekranında örnek proje | Boş editör kullanıcıya ne yapacağını söylemiyor |
| 37 | Ayrı kurtarma dosyası, açılışta sorulur | Çökme sonrası kullanıcı seçmeli, otomatik üzerine yazılmamalı |
| 38 | Bozuk dosyada çökme yok, ham JSON gösterilir | Kullanıcı en azından verisini kurtarabilsin |
| 39 | v1'de kod imzalama yok, SHA-256 yayınlanır | Sertifika maliyeti açık kaynak proje için yüksek |
| 40 | Sessiz otomatik güncelleme yok | Kullanıcının makinesine habersiz yazılım inmez |
| 41 | Telemetri yok | Açık kaynak bir araçta güven, takipten daha değerli |
| 42 | Skeuomorphism'den neumorphism'e geçildi (geliştirme sırasında) | Kullanıcı tercihi; erişilebilirlik kuralları buna karşılık sıkılaştırıldı |
| 43 | Akor seçici ve nota çarkı (bölüm 13) aynı bileşen | Tek `Wheel` bileşeni, veri kaynağı ve mod parametresiyle ikisini de karşılar |
| 44 | Sürüm uyuşmazlığında salt okunur kilit (banner yetmez) | Eski uygulamanın yeni formatı yanlış yorumlayıp veri bozması riski, kozmetik değil |

## 22. Geliştirme Sırası (öneri)

Bağımlılık zincirine göre sıralanmıştır. **Render motorunu editörden önce yaz.** Her şey tab'ın ekranda doğru görünmesine bağlı, editörü önce yazarsan neyin bozuk olduğunu göremezsin.

1. **İskelet** — Tauri v2 + React + TS + Tailwind, boş pencere açılıyor
2. **Veri modeli** — bölüm 5'teki tipler, birkaç elle yazılmış örnek proje
3. **Render motoru** — Canvas'ta tab çizimi, sabit örnek veriyle, salt okunur. Tel çizgileri, perde rakamları, ölçü çizgileri, ritim sapları
4. **`.t2s` dosya katmanı** — kaydet / aç / otomatik kayıt / son açılanlar
5. **Nota girişi** — gitar klavyesi, süre seçici, imleç ve seçim, undo/redo
5.5. **Ölçü işlemleri ve transpoze** — araya ölçü ekle/sil/çoğalt, zaman işareti ve tempo değişimi, transpoze (sınır kuralı ile). Geliştirme sırasında eklendi: §9.4'te tanımlı ama orijinal 12 adımlık listede unutulmuştu. Aynı mutation/undo altyapısını (adım 5) kullandığı için hemen ardından yapılması, menüye bağlarken mantığı geriye dönüp yazmaktan daha iyi bir sıra.
6. **Akor seçici** — 30 akorluk kütüphane, sekmeler, diyagram önizlemesi
7. **Efekt sistemi** — bölüm 7'deki v1 seti, kısayollar, palet, sağ tık
8. **Akort ve capo** — hazır setler, tel tel ayar, uyarı mekanizması
9. **Satır kırma motoru** — otomatik genişlik hesabı, justify, kullanıcı geçersiz kılma
10. **PNG export** — alfa kanal, iki boyut modu, çoklu parça, etiket
11. **Tema** — skeuomorfik kabuk, karanlık/aydınlık, render tema paletleri
12. **Menü çubuğu ve i18n** — File/Edit/Note/View/Help, Türkçe/İngilizce
12.5. **Karşılama ekranı ve sürüm kilidi** — Geliştirme sonunda tespit edilen iki eksik: (a) bölüm 16'daki üç seçenekli karşılama ekranı (Yeni proje / Proje aç / Örnek projeyi aç) ve ilk editör girişindeki atlanabilir üç adımlık ipucu turu; (b) bölüm 17'nin sürüm uyuşmazlığı kuralı — dosyanın `version` alanı uygulamadan yeniyse şu an yalnızca uyarı banner'ı gösteriliyordu, bu adımda **salt okunur açılacak şekilde kilitlenir** (düzenleme eylemleri devre dışı kalır, kaydetme engellenir).

**Erken doğrulama:** 3. adımdan sonra elle yazdığın bir örnek projeyi render edip ekran görüntüsünü gerçek bir reel videosunun üstüne koy. Okunuyor mu? Okunmuyorsa font boyutu, satır aralığı ve kontrast kararlarını orada düzelt. Bu testi 10. adıma bırakırsan her şeyi yeniden yapman gerekir.

## 23. v1 Sonrası Açık Konular

- Doğru akor ismini standart dışı akortta hesaplayan motor
- Kullanıcı tanımlı akor
- Bend eğri editörü
- Sesten tab çıkarma için pitch detection yaklaşımı (YIN/pYIN, AudioWorklet)
