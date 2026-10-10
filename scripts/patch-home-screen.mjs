import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), '..', 'ott', 'ott', 'lib', 'features', 'home', 'screens', 'home_screen.dart');
let content = fs.readFileSync(filePath, 'utf8');

// Normalize line endings to \n for replacement
const isCRLF = content.includes('\r\n');
content = content.replace(/\r\n/g, '\n');

// 1. Replace _getCategories implementation
const getCategoriesStart = content.indexOf('  List<HomeCategoryItem> _getCategories(');
const getCategoriesEnd = content.indexOf('  @override\n  Widget build(BuildContext context) {');

if (getCategoriesStart === -1 || getCategoriesEnd === -1) {
  console.error('Could not locate _getCategories in home_screen.dart', getCategoriesStart, getCategoriesEnd);
  process.exit(1);
}

const newGetCategories = `  List<HomeCategoryItem> _getCategories(
      AppLanguage appLang, List<CategoryModel>? dynamicCats) {
    final items = <HomeCategoryItem>[
      HomeCategoryItem(
        label: AppTranslations.tr('cat_all', appLang),
        id: 'cat-all',
        type: 'all',
        iconName: 'Grid',
        homeType: HomeCategoryType.all,
      ),
    ];

    if (dynamicCats != null && dynamicCats.isNotEmpty) {
      for (final m in dynamicCats) {
        String label = m.getLocalizedName(appLang).trim();
        if (label.isEmpty) continue;
        // Do not show Podcast in app
        if (m.type == 'podcast' ||
            m.id.toLowerCase().contains('podcast') ||
            m.iconName.toLowerCase().contains('headphone') ||
            label.toLowerCase() == 'podcast' ||
            label.contains('पॉडकास्ट') ||
            m.nameEnglish.toLowerCase() == 'podcast') {
          continue;
        }
        if (label.isNotEmpty && label[0] == label[0].toLowerCase()) {
          label = label[0].toUpperCase() + label.substring(1);
        }
        if (items.any((existing) =>
            existing.label.toLowerCase() == label.toLowerCase() ||
            existing.id == m.id)) {
          continue;
        }
        final hType = parseHomeCategory(label);
        items.add(HomeCategoryItem(
          label: label,
          id: m.id,
          type: m.type,
          iconName: m.iconName,
          badgeText: m.badgeText,
          badgeColor: m.badgeColor,
          homeType: hType,
        ));
      }
    }

    // Ensure all 7 core categories are present if dynamicCats missed any
    void ensureCategory(String id, String label, String type, String icon, HomeCategoryType hType, {String? badge}) {
      if (!items.any((e) => e.id == id || e.homeType == hType || e.label.toLowerCase() == label.toLowerCase())) {
        items.add(HomeCategoryItem(
          label: label,
          id: id,
          type: type,
          iconName: icon,
          badgeText: badge,
          homeType: hType,
        ));
      }
    }

    ensureCategory('cat-live', appLang == AppLanguage.marathi ? 'लाईव्ह टीव्ही' : 'LIVE', 'live', 'Radio', HomeCategoryType.all, badge: 'Live');
    ensureCategory('cat-news', AppTranslations.tr('cat_news', appLang), 'news', 'Newspaper', HomeCategoryType.news);
    ensureCategory('cat-namdar-maharashtra', AppTranslations.tr('cat_namdar_maharashtra', appLang), 'video', 'MapPin', HomeCategoryType.namdarMaharashtra);
    ensureCategory('cat-gramin-bharat-tv', AppTranslations.tr('cat_gramin_bharat_tv', appLang), 'video', 'Tractor', HomeCategoryType.graminBharatTv);
    ensureCategory('cat-entertainment', AppTranslations.tr('cat_entertainment', appLang), 'video', 'Clapperboard', HomeCategoryType.entertainment);
    ensureCategory('cat-movies', AppTranslations.tr('cat_movies', appLang), 'movie', 'Film', HomeCategoryType.movies);
    ensureCategory('cat-series', AppTranslations.tr('cat_series', appLang), 'series', 'Tv', HomeCategoryType.series);

    return items;
  }

`;

content = content.substring(0, getCategoriesStart) + newGetCategories + content.substring(getCategoriesEnd);

// 2. Replace _CategoryFilterPills
const pillsMarker = '// ===========================================================================\n// CATEGORY & GENRE FILTER PILLS STRIP\n// ===========================================================================';
const pillsStart = content.indexOf(pillsMarker);
const heroMarker = '// ===========================================================================\n// IMMERSIVE FEATURED HERO BILLBOARD CAROUSEL\n// ===========================================================================';
const pillsEnd = content.indexOf(heroMarker);

if (pillsStart === -1 || pillsEnd === -1) {
  console.error('Could not locate _CategoryFilterPills in home_screen.dart', pillsStart, pillsEnd);
  process.exit(1);
}

const newPillsClass = `// ===========================================================================
// CATEGORY & GENRE FILTER PILLS STRIP
// ===========================================================================
class _CategoryFilterPills extends ConsumerStatefulWidget {
  final List<HomeCategoryItem> categories;
  final String selectedCategory;
  final ValueChanged<String> onCategorySelected;

  const _CategoryFilterPills({
    required this.categories,
    required this.selectedCategory,
    required this.onCategorySelected,
  });

  @override
  ConsumerState<_CategoryFilterPills> createState() => _CategoryFilterPillsState();
}

class _CategoryFilterPillsState extends ConsumerState<_CategoryFilterPills> {
  final ScrollController _scrollController = ScrollController();
  bool _canScrollRight = true;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_checkScroll);
    WidgetsBinding.instance.addPostFrameCallback((_) => _checkScroll());
  }

  @override
  void didUpdateWidget(covariant _CategoryFilterPills oldWidget) {
    super.didUpdateWidget(oldWidget);
    WidgetsBinding.instance.addPostFrameCallback((_) => _checkScroll());
  }

  @override
  void dispose() {
    _scrollController.removeListener(_checkScroll);
    _scrollController.dispose();
    super.dispose();
  }

  void _checkScroll() {
    if (!_scrollController.hasClients) return;
    final maxScroll = _scrollController.position.maxScrollExtent;
    final current = _scrollController.offset;
    final canRight = maxScroll > current + 8.0;
    if (canRight != _canScrollRight) {
      if (mounted) {
        setState(() {
          _canScrollRight = canRight;
        });
      }
    }
  }

  void _scrollNext() {
    if (!_scrollController.hasClients) return;
    final target = (_scrollController.offset + 220.0).clamp(0.0, _scrollController.position.maxScrollExtent);
    _scrollController.animateTo(target, duration: const Duration(milliseconds: 320), curve: Curves.easeOut);
  }

  Widget _buildCategoryIcon(HomeCategoryItem item, bool isSelected) {
    IconData iconData;
    LinearGradient bgGradient;
    BoxBorder? border;

    final type = item.homeType;
    final iconName = item.iconName.toLowerCase();
    final lowerLabel = item.label.toLowerCase();

    if (type == HomeCategoryType.all || item.type == 'all') {
      iconData = Icons.grid_view_rounded;
      bgGradient = isSelected
          ? const LinearGradient(
              colors: [Colors.transparent, Colors.transparent])
          : const LinearGradient(
              colors: [Color(0xFF00C6FF), Color(0xFF0072FF)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            );
      if (isSelected) {
        border = Border.all(
            color: Colors.white.withValues(alpha: 0.6), width: 1.0);
      }
    } else if (iconName.contains('headphone') ||
        iconName.contains('mic') ||
        type == HomeCategoryType.podcast ||
        lowerLabel.contains('podcast') ||
        lowerLabel.contains('पॉडकास्ट')) {
      iconData = Icons.podcasts_rounded;
      bgGradient = const LinearGradient(
        colors: [Color(0xFFFF9A44), Color(0xFFFC6076)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      );
    } else if (iconName.contains('radio') || item.type == 'live') {
      iconData = Icons.radio_rounded;
      bgGradient = const LinearGradient(
        colors: [Color(0xFF00C6FF), Color(0xFF0072FF)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      );
    } else if (iconName.contains('newspaper') ||
        iconName.contains('news') ||
        type == HomeCategoryType.news ||
        lowerLabel.contains('news') ||
        lowerLabel.contains('बातम्या') ||
        lowerLabel.contains('समाचार')) {
      iconData = Icons.feed_rounded;
      bgGradient = const LinearGradient(
        colors: [Color(0xFFFF416C), Color(0xFFFF4B2B)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      );
    } else if (iconName.contains('tractor') ||
        iconName.contains('sprout') ||
        type == HomeCategoryType.graminSamasya ||
        lowerLabel.contains('rural') ||
        lowerLabel.contains('ग्रामीण') ||
        lowerLabel.contains('शेती') ||
        lowerLabel.contains('समस्या')) {
      iconData = Icons.agriculture_rounded;
      bgGradient = const LinearGradient(
        colors: [Color(0xFF8B4513), Color(0xFFD2691E)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      );
    } else if (iconName.contains('film') ||
        type == HomeCategoryType.movies ||
        lowerLabel.contains('movie') ||
        lowerLabel.contains('चित्रपट') ||
        lowerLabel.contains('फिल्म')) {
      iconData = Icons.movie_rounded;
      bgGradient = const LinearGradient(
        colors: [Color(0xFF36D1DC), Color(0xFF5B86E5)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      );
    } else if (iconName.contains('tv') ||
        type == HomeCategoryType.series ||
        lowerLabel.contains('series') ||
        lowerLabel.contains('मालिका')) {
      iconData = Icons.live_tv_rounded;
      bgGradient = const LinearGradient(
        colors: [Color(0xFFDA22FF), Color(0xFF9733EE)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      );
    } else if (iconName.contains('music') ||
        lowerLabel.contains('music') ||
        lowerLabel.contains('गाणी')) {
      iconData = Icons.music_note_rounded;
      bgGradient = const LinearGradient(
        colors: [Color(0xFFEC4899), Color(0xFF8B5CF6)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      );
    } else if (iconName.contains('mappin') ||
        type == HomeCategoryType.namdarMaharashtra) {
      iconData = Icons.tv_rounded;
      bgGradient = const LinearGradient(
        colors: [Color(0xFFB993D6), Color(0xFF8CA6DB)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      );
    } else if (iconName.contains('clapperboard') ||
        type == HomeCategoryType.entertainment) {
      iconData = Icons.movie_creation_rounded;
      bgGradient = const LinearGradient(
        colors: [Color(0xFFFFB75E), Color(0xFFED8F03)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      );
    } else if (type == HomeCategoryType.trending) {
      iconData = Icons.trending_up_rounded;
      bgGradient = const LinearGradient(
        colors: [Color(0xFF10B981), Color(0xFF047857)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      );
    } else if (type == HomeCategoryType.drama) {
      iconData = Icons.theater_comedy_rounded;
      bgGradient = const LinearGradient(
        colors: [Color(0xFF8B5CF6), Color(0xFF6D28D9)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      );
    } else if (type == HomeCategoryType.action) {
      iconData = Icons.local_fire_department_rounded;
      bgGradient = const LinearGradient(
        colors: [Color(0xFFEF4444), Color(0xFFB91C1C)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      );
    } else if (iconName.contains('heart') || lowerLabel.contains('heart')) {
      iconData = Icons.favorite_rounded;
      bgGradient = const LinearGradient(
        colors: [Color(0xFFFF416C), Color(0xFFFF4B2B)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      );
    } else if (iconName.contains('camera')) {
      iconData = Icons.camera_alt_rounded;
      bgGradient = const LinearGradient(
        colors: [Color(0xFF3B82F6), Color(0xFF1D4ED8)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      );
    } else if (iconName.contains('sparkle')) {
      iconData = Icons.auto_awesome_rounded;
      bgGradient = const LinearGradient(
        colors: [Color(0xFF8B5CF6), Color(0xFFD946EF)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      );
    } else {
      iconData = Icons.auto_awesome_rounded;
      bgGradient = const LinearGradient(
        colors: [Color(0xFFFF9A44), Color(0xFFFC6076)],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      );
    }

    return Container(
      width: 24,
      height: 24,
      decoration: BoxDecoration(
        gradient: bgGradient,
        borderRadius: BorderRadius.circular(7),
        border: border,
      ),
      child: Center(
        child: Icon(iconData, size: 14, color: Colors.white),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = ref.watch(isDarkThemeProvider);
    final activeType = parseHomeCategory(widget.selectedCategory);

    return SizedBox(
      height: 40,
      child: Stack(
        alignment: Alignment.centerRight,
        children: [
          ListView.builder(
            controller: _scrollController,
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: 14),
            itemCount: widget.categories.length,
            itemBuilder: (context, index) {
              final item = widget.categories[index];
              final isSelected = (index == 0 &&
                      (widget.selectedCategory == 'All' ||
                          widget.selectedCategory == 'सर्व' ||
                          widget.selectedCategory == 'सभी')) ||
                  (widget.selectedCategory == item.label) ||
                  (item.homeType != HomeCategoryType.all &&
                      item.homeType == activeType);

              return Padding(
                padding: const EdgeInsets.only(right: 8.0),
                child: GestureDetector(
                  onTap: () {
                    if (index == 0 || isSelected) {
                      widget.onCategorySelected('All');
                    } else {
                      widget.onCategorySelected(item.label);
                    }
                  },
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    curve: Curves.easeInOut,
                    height: 38,
                    padding: const EdgeInsets.symmetric(
                        horizontal: 11, vertical: 5),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? const Color(0xFF00A97E)
                          : (isDark
                              ? AppColors.surfaceLight.withValues(alpha: 0.7)
                              : Colors.white),
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(
                        color: isSelected
                            ? const Color(0xFF00A97E)
                            : (isDark
                                ? AppColors.divider.withValues(alpha: 0.7)
                                : const Color(0xFFF1F5F9)),
                        width: 1.0,
                      ),
                      boxShadow: isSelected
                          ? [
                              BoxShadow(
                                color: const Color(0xFF00A97E)
                                    .withValues(alpha: 0.35),
                                blurRadius: 8,
                                offset: const Offset(0, 2),
                              ),
                            ]
                          : (!isDark
                              ? [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.03),
                                    blurRadius: 4,
                                    offset: const Offset(0, 1),
                                  ),
                                ]
                              : null),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        _buildCategoryIcon(item, isSelected),
                        const SizedBox(width: 6),
                        Text(
                          item.label,
                          style: GoogleFonts.poppins(
                            fontSize: 12.5,
                            fontWeight: isSelected
                                ? FontWeight.w600
                                : FontWeight.w500,
                            color: isSelected
                                ? Colors.white
                                : (isDark
                                    ? AppColors.darkTextSecondary
                                    : const Color(0xFF475569)),
                            letterSpacing: 0.1,
                          ),
                        ),
                        if (item.badgeText != null &&
                            item.badgeText!.isNotEmpty) ...[
                          const SizedBox(width: 5),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 5, vertical: 1.5),
                            decoration: BoxDecoration(
                              color: isSelected
                                  ? Colors.white.withValues(alpha: 0.25)
                                  : const Color(0xFFBE185D).withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              item.badgeText!,
                              style: GoogleFonts.inter(
                                fontSize: 8.5,
                                fontWeight: FontWeight.w700,
                                color: isSelected
                                    ? Colors.white
                                    : const Color(0xFFBE185D),
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
          if (_canScrollRight)
            Positioned(
              right: 0,
              top: 0,
              bottom: 0,
              child: GestureDetector(
                onTap: _scrollNext,
                child: Container(
                  width: 32,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.centerLeft,
                      end: Alignment.centerRight,
                      colors: [
                        (isDark ? AppColors.background : const Color(0xFFF8FAFC))
                            .withValues(alpha: 0.0),
                        (isDark ? AppColors.background : const Color(0xFFF8FAFC))
                            .withValues(alpha: 0.95),
                      ],
                    ),
                  ),
                  child: Center(
                    child: Container(
                      width: 20,
                      height: 20,
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF334155) : Colors.white,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.12),
                            blurRadius: 4,
                          ),
                        ],
                      ),
                      child: Icon(
                        Icons.chevron_right_rounded,
                        size: 14,
                        color: isDark ? Colors.white70 : const Color(0xFF475569),
                      ),
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

`;

content = content.substring(0, pillsStart) + newPillsClass + content.substring(pillsEnd);

if (isCRLF) {
  content = content.replace(/\n/g, '\r\n');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully patched home_screen.dart!');
