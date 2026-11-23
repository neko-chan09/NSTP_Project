<?php
namespace App\Services;

/** Conservative allow-list for NSTP table/data dumps, never arbitrary SQL scripts. */
class RecoverySqlGuard
{
    public function check(string $sql): void
    {
        $sql = preg_replace_callback('#/\*!(\d{5,6})?\s*([\s\S]*?)\*/#', fn($m) => $m[2], $sql);
        $statement = ''; $length = strlen($sql);
        for ($i = 0; $i < $length; $i++) {
            $c = $sql[$i];
            if ($c === "'" || $c === '"' || $c === '`') {
                $quote = $c; $value = ''; $closed = false;
                for ($i++; $i < $length; $i++) {
                    if ($sql[$i] === '\\' && $quote !== '`') { $i++; continue; }
                    if ($sql[$i] === $quote) {
                        if (($sql[$i+1] ?? '') === $quote) { $i++; continue; }
                        $closed = true; break;
                    }
                    $value .= $sql[$i];
                }
                if (!$closed) throw new \RuntimeException('Unterminated SQL value.');
                // Double quotes are identifiers in SQLite dumps; single quotes are data.
                if ($quote === "'") $statement .= ' LITERAL ';
                else {
                    if (!preg_match('/^[A-Za-z0-9_]+$/D', $value)) throw new \RuntimeException('Unsupported SQL identifier.');
                    if (preg_match('/^(?:load_file|sys_eval|sys_exec)$/i',$value)) throw new \RuntimeException('Executable SQL function is not allowed.');
                    $statement .= ' IDENT ';
                }
            } elseif (($c === '-' && ($sql[$i+1] ?? '') === '-' && ctype_space($sql[$i+2] ?? ' ')) || $c === '#') {
                while ($i < $length && $sql[$i] !== "\n") $i++;
                $statement .= ' ';
            } elseif ($c === '/' && ($sql[$i+1] ?? '') === '*') {
                $end = strpos($sql, '*/', $i+2);
                if ($end === false) throw new \RuntimeException('Unterminated SQL comment.');
                $i = $end+1; $statement .= ' ';
            } elseif ($c === ';') {
                $this->statement(trim($statement)); $statement = '';
            } else $statement .= $c;
        }
        $this->statement(trim($statement));
    }

    private function statement(string $s): void
    {
        if ($s === '') return;
        if (preg_match('/^SET\s+(.+)$/is',$s,$set)) {
            if (preg_match('/^NAMES\s+[A-Za-z0-9_]+$/i',$set[1])) return;
            foreach(explode(',',$set[1]) as $assignment) {
                if (!preg_match('/^\s*(?:(?:@(?:OLD_[A-Za-z0-9_]+|saved_cs_client)\s*=\s*@@[A-Za-z0-9_]+)|(?:(?:FOREIGN_KEY_CHECKS|UNIQUE_CHECKS|SQL_MODE|TIME_ZONE|CHARACTER_SET_CLIENT|CHARACTER_SET_RESULTS|COLLATION_CONNECTION|SQL_NOTES)\s*=\s*(?:LITERAL|[01]|utf8mb4|@OLD_[A-Za-z0-9_]+|@saved_cs_client)))\s*$/i',$assignment)) throw new \RuntimeException('Unsupported SQL session setting.');
            }
            return;
        }
        if (preg_match('/\b(USE|ATTACH|DETACH|OUTFILE|DUMPFILE|LOAD_FILE|LOAD\s+DATA|GRANT|REVOKE|TRIGGER|PROCEDURE|FUNCTION|EVENT|DEFINER|DIRECTORY|TABLESPACE|SLEEP|BENCHMARK|SELECT|FEDERATED|CONNECTION)\b|\./i', $s)) {
            // Decimal literals in INSERT statements are permitted below; schema-qualified names are not.
            if (!preg_match('/^INSERT\s+INTO\s+[A-Za-z0-9_]+\s+(?:\([^)]*\)\s*)?VALUES\s+/i', $s)) throw new \RuntimeException('Dump contains unsupported or cross-database SQL.');
        }
        if (preg_match('/^INSERT\s+INTO\s+[A-Za-z0-9_]+\s+(?:\([^)]*\)\s*)?VALUES\s+([\s\S]+)$/i', $s, $m)) {
            $values = preg_replace('/\b(?:LITERAL|NULL|TRUE|FALSE)\b|\b0x[0-9a-f]+\b|[+-]?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|[\s(),]/i', '', $m[1]);
            if ($values !== '') throw new \RuntimeException('Only literal data values are allowed in imported dumps.');
            return;
        }
        if (preg_match('/^DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?[A-Za-z0-9_]+$/i', $s)) return;
        if (preg_match('/^CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[A-Za-z0-9_]+\s*\(/i', $s)) return;
        if (preg_match('/^(?:LOCK\s+TABLES\s+[A-Za-z0-9_]+\s+WRITE|UNLOCK\s+TABLES)$/i', $s)) return;
        if (preg_match('/^ALTER\s+TABLE\s+[A-Za-z0-9_]+\s+(?:ENABLE|DISABLE)\s+KEYS$/i', $s)) return;
        if (preg_match('/^PRAGMA\s+foreign_keys\s*=\s*(?:ON|OFF|0|1)$/i', $s)) return;
        if (preg_match('/^SET\s+(?:NAMES\s+[A-Za-z0-9_]+|(?:@OLD_[A-Za-z0-9_]+\s*=\s*@@[A-Za-z0-9_]+)|(?:(?:FOREIGN_KEY_CHECKS|UNIQUE_CHECKS|SQL_MODE|TIME_ZONE|CHARACTER_SET_CLIENT|CHARACTER_SET_RESULTS|COLLATION_CONNECTION|SQL_NOTES)\s*=\s*(?:LITERAL|[01]|@OLD_[A-Za-z0-9_]+)))$/i', $s)) return;
        throw new \RuntimeException('Unsupported SQL statement. Import an NSTP database-and-storage backup.');
    }
}
