"""
GlobeTimeZone V9.1 - 全站可信度仪表盘注入脚本
E07 前端体验优化专家 交付
将 trust-dashboard.js 注入所有 HTML 页面的 </body> 之前
"""
import os
import re
import sys

PUBLIC_DIR = r'C:\Users\ASUS\WorkBuddy\Claw\globetimezone\public'

TRUST_DASHBOARD_SNIPPET = '''  <!-- V9.1 可信度仪表盘 -->
  <script src="/js/trust-dashboard.js" defer></script>'''

# 已在 </body> 前有 trust-dashboard 引用的跳过模式
ALREADY_INJECTED_PATTERN = re.compile(r'trust-dashboard\.js')


def find_html_files(root_dir):
    """递归查找所有 HTML 文件"""
    html_files = []
    for dirpath, dirnames, filenames in os.walk(root_dir):
        # 跳过 node_modules 等非发布目录
        dirnames[:] = [d for d in dirnames if not d.startswith('.')]
        for filename in filenames:
            if filename.endswith('.html'):
                html_files.append(os.path.join(dirpath, filename))
    return html_files


def inject_trust_dashboard(filepath):
    """在 </body> 之前注入可信度仪表盘脚本"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 检查是否已经注入
    if ALREADY_INJECTED_PATTERN.search(content):
        return 'skipped'

    # 检查是否有 </body> 标签
    if '</body>' not in content:
        print(f'  [警告] {filepath}: 没有 </body> 标签，跳过')
        return 'no_body'

    # 在最后一个 </body> 之前注入
    # 使用 rfind 找到最后一个 </body>
    body_close_pos = content.rfind('</body>')
    if body_close_pos == -1:
        return 'no_body'

    new_content = content[:body_close_pos] + TRUST_DASHBOARD_SNIPPET + '\n' + content[body_close_pos:]

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)

    return 'injected'


def main():
    print('=' * 60)
    print('GlobeTimeZone V9.1 - 全站可信度仪表盘注入')
    print('=' * 60)
    print(f'目标目录: {PUBLIC_DIR}')
    print()

    html_files = find_html_files(PUBLIC_DIR)
    print(f'发现 {len(html_files)} 个 HTML 文件')
    print()

    results = {'injected': 0, 'skipped': 0, 'no_body': 0, 'error': 0}
    injected_files = []
    skipped_files = []
    error_files = []

    for filepath in sorted(html_files):
        rel_path = os.path.relpath(filepath, PUBLIC_DIR)
        try:
            result = inject_trust_dashboard(filepath)
            results[result] = results.get(result, 0) + 1

            if result == 'injected':
                injected_files.append(rel_path)
                print(f'  [OK] {rel_path}')
            elif result == 'skipped':
                skipped_files.append(rel_path)
            elif result == 'no_body':
                print(f'  [跳过] {rel_path}: 无 </body> 标签')
        except Exception as e:
            results['error'] += 1
            error_files.append((rel_path, str(e)))
            print(f'  [错误] {rel_path}: {e}')

    print()
    print('=' * 60)
    print('注入结果汇总:')
    print(f'  已注入: {results["injected"]} 个')
    print(f'  已跳过(重复): {results.get("skipped", 0)} 个')
    print(f'  无body标签: {results.get("no_body", 0)} 个')
    print(f'  错误: {results.get("error", 0)} 个')
    print('=' * 60)

    if injected_files:
        print()
        print(f'成功注入的 {len(injected_files)} 个文件:')
        for f in injected_files:
            print(f'  - {f}')

    if error_files:
        print()
        print(f'失败文件:')
        for f, err in error_files:
            print(f'  - {f}: {err}')

    print()
    print('可信度仪表盘组件路径: /js/trust-dashboard.js')
    print('V9.1 全站注入完成。')


if __name__ == '__main__':
    main()
