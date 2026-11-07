import os
import pandas as pd
import numpy as np

def run_lead_analysis(csv_path="data/smb_leads.csv"):
    if not os.path.exists(csv_path):
        csv_path = "public/assets/aistudio/smb_leads_b2521e8c.csv"
    
    df = pd.read_csv(csv_path)
    total_records = len(df)
    original_columns = list(df.columns)
    columns_count = len(original_columns)
    
    # 1. Schema & Data Types
    schema_info = {col: str(df[col].dtype) for col in original_columns}
    
    # 2. Segments & Distribution
    segment_dist = df['segment'].value_counts()
    segment_share = (df['segment'].value_counts(normalize=True) * 100).round(2)
    segment_summary = []
    for seg, count in segment_dist.items():
        segment_summary.append({
            "segment": seg,
            "count": int(count),
            "percentage": float(segment_share[seg])
        })
        
    # 3. Funnel Conversion Rates
    # Stages reached: Lead -> Contacted -> Needs assessed -> Quote accepted -> KYC complete -> Activated
    funnel_stages = [
        "Lead",
        "Contacted",
        "Needs assessed",
        "Quote accepted",
        "KYC complete",
        "Activated"
    ]
    
    stage_hierarchy = {
        "Lead": 1,
        "Contacted": 2,
        "Needs assessed": 3,
        "Quote accepted": 4,
        "KYC complete": 5,
        "Activated": 6
    }
    
    df['stage_rank'] = df['stage_reached'].map(stage_hierarchy).fillna(1)
    
    funnel_counts = []
    for i, stage in enumerate(funnel_stages):
        rank = stage_hierarchy[stage]
        # Leads reaching this stage or higher
        count = int((df['stage_rank'] >= rank).sum())
        pct_of_total = round((count / total_records) * 100, 2)
        stage_drop_rate = 0.0
        if i > 0:
            prev_count = funnel_counts[i-1]["reached_count"]
            step_conversion = round((count / prev_count) * 100, 2) if prev_count > 0 else 0.0
            step_drop = round(100.0 - step_conversion, 2)
        else:
            step_conversion = 100.0
            step_drop = 0.0
            
        funnel_counts.append({
            "stage": stage,
            "reached_count": count,
            "pct_of_total_leads": pct_of_total,
            "step_conversion_rate": step_conversion,
            "step_drop_rate": step_drop
        })
        
    # 4. Drop-off reasons analysis
    dropped_df = df[df['outcome'] == 'Dropped']
    drop_reasons_overall = df['drop_reason'].dropna().value_counts()
    drop_reasons_summary = [
        {"reason": reason, "count": int(cnt), "pct": round(cnt / len(dropped_df) * 100, 2)}
        for reason, cnt in drop_reasons_overall.items()
    ]
    
    # Drop reasons grouped by stage_reached
    stage_drop_reasons = {}
    for stage, group in dropped_df.groupby('stage_reached'):
        stage_drop_reasons[stage] = group['drop_reason'].value_counts().to_dict()
        
    # 5. Segment-wise Activation Rates
    segment_activation = []
    for seg, group in df.groupby('segment'):
        seg_total = len(group)
        seg_activated = int((group['outcome'] == 'Activated').sum())
        act_rate = round((seg_activated / seg_total) * 100, 2)
        # Average days lead to activation
        act_days = group[group['outcome'] == 'Activated']['days_lead_to_activation'].dropna()
        avg_days = round(float(act_days.mean()), 2) if len(act_days) > 0 else 0.0
        # ARPU for activated leads
        rev_group = group[group['outcome'] == 'Activated']['monthly_bundle_value_inr'].dropna()
        avg_arpu = round(float(rev_group.mean()), 2) if len(rev_group) > 0 else 0.0
        
        segment_activation.append({
            "segment": seg,
            "total_leads": seg_total,
            "activated_count": seg_activated,
            "activation_rate_pct": act_rate,
            "avg_days_to_activate": avg_days,
            "avg_monthly_arpu_inr": avg_arpu
        })
    segment_activation.sort(key=lambda x: x["activation_rate_pct"], reverse=True)
    
    # 6. Lead Sources and Performance
    lead_source_summary = []
    for src, group in df.groupby('lead_source'):
        src_total = len(group)
        src_activated = int((group['outcome'] == 'Activated').sum())
        src_act_rate = round((src_activated / src_total) * 100, 2)
        avg_cac = round(float(group['acquisition_cost_inr'].dropna().mean()), 2)
        act_group = group[group['outcome'] == 'Activated']
        avg_arpu = round(float(act_group['monthly_bundle_value_inr'].dropna().mean()), 2) if len(act_group) > 0 else 0.0
        
        # 6-month churn for activated leads in this source
        churned_cnt = int((act_group['churned_within_6_months'] == 'Y').sum())
        churn_rate = round((churned_cnt / src_activated) * 100, 2) if src_activated > 0 else 0.0
        
        lead_source_summary.append({
            "lead_source": src,
            "total_leads": src_total,
            "activated_count": src_activated,
            "activation_rate_pct": src_act_rate,
            "avg_cac_inr": avg_cac,
            "avg_monthly_arpu_inr": avg_arpu,
            "churned_6m_count": churned_cnt,
            "churn_rate_6m_pct": churn_rate
        })
    lead_source_summary.sort(key=lambda x: x["activation_rate_pct"], reverse=True)
    
    # 7. Overall Financials, CAC, Revenue, 6-Month Churn
    activated_df = df[df['outcome'] == 'Activated']
    total_activated = len(activated_df)
    
    total_acquisition_cost = float(df['acquisition_cost_inr'].sum())
    avg_cac_all_leads = round(float(df['acquisition_cost_inr'].mean()), 2)
    cac_per_activated_lead = round(total_acquisition_cost / total_activated, 2) if total_activated > 0 else 0.0
    
    total_monthly_recurring_rev = float(activated_df['monthly_bundle_value_inr'].sum())
    avg_monthly_bundle_rev = round(float(activated_df['monthly_bundle_value_inr'].mean()), 2)
    total_annual_contracted_rev = float((activated_df['monthly_bundle_value_inr'] * activated_df['contract_months']).sum())
    total_setup_fees = float(activated_df['one_time_setup_inr'].sum())
    
    # Churn
    churned_6m_count = int((activated_df['churned_within_6_months'] == 'Y').sum())
    churn_6m_rate = round((churned_6m_count / total_activated) * 100, 2) if total_activated > 0 else 0.0
    
    # NPS
    nps_scores = activated_df['nps_score'].dropna()
    avg_nps = round(float(nps_scores.mean()), 2) if len(nps_scores) > 0 else 0.0
    
    # Avg days to activate
    avg_days_to_act = round(float(activated_df['days_lead_to_activation'].dropna().mean()), 2)
    
    # 8. City Tier Analysis
    tier_summary = []
    for tier, group in df.groupby('city_tier'):
        t_total = len(group)
        t_activated = int((group['outcome'] == 'Activated').sum())
        t_act_rate = round((t_activated / t_total) * 100, 2)
        tier_summary.append({
            "tier": tier,
            "total_leads": t_total,
            "activated_count": t_activated,
            "activation_rate_pct": t_act_rate
        })
        
    return {
        "total_records": total_records,
        "columns_count": columns_count,
        "columns": original_columns,
        "schema_info": schema_info,
        "segment_distribution": segment_summary,
        "funnel_conversion": funnel_counts,
        "drop_reasons_overall": drop_reasons_summary,
        "stage_drop_reasons": stage_drop_reasons,
        "segment_activation": segment_activation,
        "lead_source_summary": lead_source_summary,
        "city_tier_summary": tier_summary,
        "financials": {
            "total_leads": total_records,
            "total_activated": total_activated,
            "overall_activation_rate_pct": round((total_activated / total_records) * 100, 2),
            "total_acquisition_cost_inr": total_acquisition_cost,
            "avg_cac_all_leads_inr": avg_cac_all_leads,
            "cac_per_activated_customer_inr": cac_per_activated_lead,
            "total_monthly_recurring_rev_inr": total_monthly_recurring_rev,
            "avg_monthly_arpu_inr": avg_monthly_bundle_rev,
            "total_setup_fees_inr": total_setup_fees,
            "total_annual_contracted_rev_inr": total_annual_contracted_rev,
            "churned_6m_count": churned_6m_count,
            "churn_6m_rate_pct": churn_6m_rate,
            "avg_nps": avg_nps,
            "avg_days_to_activation": avg_days_to_act
        }
    }

if __name__ == "__main__":
    import json
    res = run_lead_analysis()
    print("=== LEAD ANALYSIS RESULT ===")
    print(json.dumps(res, indent=2))
