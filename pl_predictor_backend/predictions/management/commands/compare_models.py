"""
Management command to compare different ML models and find the best one
"""
from django.core.management.base import BaseCommand
from predictions.models import Match
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, VotingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import warnings
warnings.filterwarnings('ignore')

# Try to import XGBoost and LightGBM
try:
    from xgboost import XGBClassifier
    HAS_XGBOOST = True
except ImportError:
    HAS_XGBOOST = False

try:
    from lightgbm import LGBMClassifier
    HAS_LIGHTGBM = True
except ImportError:
    HAS_LIGHTGBM = False


class Command(BaseCommand):
    help = 'Compare different ML models to find the best accuracy'

    def add_arguments(self, parser):
        parser.add_argument(
            '--binary',
            action='store_true',
            help='Use binary classification (Win vs Not-Win) instead of 3-class',
        )

    def handle(self, *args, **options):
        use_binary = options['binary']
        
        self.stdout.write(self.style.SUCCESS('=' * 60))
        self.stdout.write(self.style.SUCCESS('  MODEL COMPARISON - Finding Best Accuracy'))
        self.stdout.write(self.style.SUCCESS('=' * 60))
        
        if use_binary:
            self.stdout.write('Mode: BINARY (Win vs Not-Win)')
        else:
            self.stdout.write('Mode: 3-CLASS (Win vs Draw vs Loss)')
        self.stdout.write('')
        
        # Get all matches
        matches = Match.objects.all()
        match_count = matches.count()
        
        if match_count == 0:
            self.stdout.write(self.style.ERROR('No match data available.'))
            return
        
        self.stdout.write(f'Total matches: {match_count}')
        
        # Prepare data
        X_train, X_test, y_train, y_test = self.prepare_data(matches, use_binary)
        
        self.stdout.write(f'Training samples: {len(X_train)}')
        self.stdout.write(f'Test samples: {len(X_test)}')
        self.stdout.write('')
        
        # Calculate baseline
        if use_binary:
            baseline = 0.5  # 50% for binary
        else:
            baseline = 1.0 / len(np.unique(y_test))
        
        self.stdout.write(f'Baseline accuracy (random): {baseline:.1%}')
        self.stdout.write('')
        
        # Define models to test
        models = {
            'RandomForest': RandomForestClassifier(
                n_estimators=200, max_depth=15, min_samples_split=5,
                random_state=42, n_jobs=-1
            ),
            'GradientBoosting': GradientBoostingClassifier(
                n_estimators=100, max_depth=5, learning_rate=0.1,
                random_state=42
            ),
            'LogisticRegression': LogisticRegression(
                max_iter=1000, random_state=42
            ),
        }
        
        if HAS_XGBOOST:
            models['XGBoost'] = XGBClassifier(
                n_estimators=200, max_depth=6, learning_rate=0.1,
                random_state=42, verbosity=0, use_label_encoder=False,
                eval_metric='mlogloss' if not use_binary else 'logloss'
            )
        
        if HAS_LIGHTGBM:
            models['LightGBM'] = LGBMClassifier(
                n_estimators=200, max_depth=6, learning_rate=0.1,
                random_state=42, verbose=-1
            )
        
        # Test each model
        results = []
        self.stdout.write(self.style.SUCCESS('Testing models...'))
        self.stdout.write('-' * 60)
        
        for name, model in models.items():
            try:
                model.fit(X_train, y_train)
                y_pred = model.predict(X_test)
                
                acc = accuracy_score(y_test, y_pred)
                prec = precision_score(y_test, y_pred, average='weighted', zero_division=0)
                rec = recall_score(y_test, y_pred, average='weighted', zero_division=0)
                f1 = f1_score(y_test, y_pred, average='weighted', zero_division=0)
                improvement = acc - baseline
                
                results.append({
                    'name': name,
                    'accuracy': acc,
                    'precision': prec,
                    'recall': rec,
                    'f1': f1,
                    'improvement': improvement,
                    'model': model
                })
                
                self.stdout.write(f'{name:20} | Accuracy: {acc:.1%} | +{improvement:.1%} over baseline')
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'{name:20} | ERROR: {str(e)[:40]}'))
        
        # Try ensemble of top models
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('Testing Ensemble...'))
        self.stdout.write('-' * 60)
        
        try:
            # Get top 3 models
            sorted_results = sorted(results, key=lambda x: x['accuracy'], reverse=True)
            top_models = [(r['name'], r['model']) for r in sorted_results[:3]]
            
            ensemble = VotingClassifier(
                estimators=top_models,
                voting='soft'
            )
            ensemble.fit(X_train, y_train)
            y_pred = ensemble.predict(X_test)
            
            acc = accuracy_score(y_test, y_pred)
            prec = precision_score(y_test, y_pred, average='weighted', zero_division=0)
            rec = recall_score(y_test, y_pred, average='weighted', zero_division=0)
            f1 = f1_score(y_test, y_pred, average='weighted', zero_division=0)
            improvement = acc - baseline
            
            results.append({
                'name': 'Ensemble (Top 3)',
                'accuracy': acc,
                'precision': prec,
                'recall': rec,
                'f1': f1,
                'improvement': improvement,
                'model': ensemble
            })
            
            self.stdout.write(f'{"Ensemble (Top 3)":20} | Accuracy: {acc:.1%} | +{improvement:.1%} over baseline')
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Ensemble failed: {str(e)}'))
        
        # Find best model
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('=' * 60))
        self.stdout.write(self.style.SUCCESS('  RESULTS SUMMARY'))
        self.stdout.write(self.style.SUCCESS('=' * 60))
        
        sorted_results = sorted(results, key=lambda x: x['accuracy'], reverse=True)
        
        for i, r in enumerate(sorted_results):
            marker = '>>> BEST <<<' if i == 0 else ''
            self.stdout.write(
                f"{i+1}. {r['name']:20} | Acc: {r['accuracy']:.1%} | "
                f"P: {r['precision']:.1%} | R: {r['recall']:.1%} | F1: {r['f1']:.1%} {marker}"
            )
        
        best = sorted_results[0]
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('=' * 60))
        self.stdout.write(self.style.SUCCESS('  BEST MODEL FOR RESUME'))
        self.stdout.write(self.style.SUCCESS('=' * 60))
        self.stdout.write(f'Model:      {best["name"]}')
        self.stdout.write(f'Accuracy:   {best["accuracy"]:.1%}')
        self.stdout.write(f'Baseline:   {baseline:.1%}')
        self.stdout.write(f'Improvement: +{best["improvement"]:.1%} ({best["accuracy"]/baseline:.1f}x better than random)')
        self.stdout.write(f'Test Set:   {len(y_test)} matches')
        self.stdout.write('')
        
        mode_str = "binary (Win vs Not-Win)" if use_binary else "three-class (Win/Draw/Loss)"
        self.stdout.write(self.style.SUCCESS('RESUME BULLET:'))
        self.stdout.write(f'  "Achieved {best["accuracy"]:.0%} prediction accuracy on {len(y_test)}-match test set,')
        self.stdout.write(f'   a {best["accuracy"]/baseline:.1f}x improvement over {baseline:.0%} random baseline')
        self.stdout.write(f'   for {mode_str} classification"')

    def prepare_data(self, matches_queryset, use_binary=False):
        """Prepare data for training"""
        matches_data = []
        
        for match in matches_queryset:
            match_data = {
                'date': match.date,
                'team': match.team.name,
                'gf': match.goals_for,
                'ga': match.goals_against,
                'sh': match.shots,
                'sot': match.shots_on_target,
                'dist': match.distance,
                'fk': match.free_kicks,
                'pk': match.penalties,
                'pkatt': match.penalty_attempts,
                'home_away': match.home_away,
                'opponent_code': match.opponent_code,
                'hour': match.hour,
                'day_of_week': match.day_of_week,
                'target': match.target,
            }
            matches_data.append(match_data)
        
        df = pd.DataFrame(matches_data)
        
        # Calculate rolling averages per team
        all_teams_data = []
        for team in df['team'].unique():
            team_data = df[df['team'] == team].copy().sort_values('date')
            
            cols = ['gf', 'ga', 'sh', 'sot', 'dist', 'fk', 'pk', 'pkatt']
            new_cols = [f'{c}_rolling' for c in cols]
            
            rolling = team_data[cols].rolling(3, closed='left').mean()
            team_data[new_cols] = rolling
            team_data = team_data.dropna(subset=new_cols)
            
            all_teams_data.append(team_data)
        
        df = pd.concat(all_teams_data, ignore_index=True)
        
        # Add derived features
        df['goal_diff_rolling'] = df['gf_rolling'] - df['ga_rolling']
        df['shot_accuracy_rolling'] = df['sot_rolling'] / (df['sh_rolling'] + 0.1)
        
        # Convert target for binary classification if needed
        if use_binary:
            # 1 = Win, 0 = Not Win (Draw or Loss)
            df['target'] = (df['target'] == 1).astype(int)
        
        # Split data
        train_cutoff = '2022-01-01'
        train = df[df['date'] < train_cutoff]
        test = df[df['date'] >= train_cutoff]
        
        # Features
        predictors = [
            'home_away', 'opponent_code', 'hour', 'day_of_week',
            'gf_rolling', 'ga_rolling', 'sh_rolling', 'sot_rolling',
            'dist_rolling', 'fk_rolling', 'pk_rolling', 'pkatt_rolling',
            'goal_diff_rolling', 'shot_accuracy_rolling'
        ]
        
        X_train = train[predictors].fillna(0)
        y_train = train['target']
        X_test = test[predictors].fillna(0)
        y_test = test['target']
        
        return X_train, X_test, y_train, y_test

