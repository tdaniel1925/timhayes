"""
Super Admin Business Management API Endpoints
Complete SaaS business operation endpoints
"""

# ============================================================================
# PLANS & PRICING MANAGEMENT
# ============================================================================

@app.route('/api/superadmin/plans', methods=['GET'])
@jwt_required()
def get_all_plans():
    """Get all pricing plans"""
    try:
        claims = get_jwt()
        if claims.get('role') != 'superadmin':
            return jsonify({'error': 'Unauthorized'}), 403

        plans = Plan.query.order_by(Plan.sort_order).all()

        return jsonify({
            'plans': [{
                'id': p.id,
                'name': p.name,
                'slug': p.slug,
                'description': p.description,
                'monthly_price': p.monthly_price,
                'annual_price': p.annual_price,
                'setup_fee': p.setup_fee,
                'max_calls_per_month': p.max_calls_per_month,
                'max_users': p.max_users,
                'max_storage_gb': p.max_storage_gb,
                'max_recording_minutes': p.max_recording_minutes,
                'has_api_access': p.has_api_access,
                'has_white_label': p.has_white_label,
                'has_priority_support': p.has_priority_support,
                'trial_days': p.trial_days,
                'is_active': p.is_active,
                'is_public': p.is_public,
                'sort_order': p.sort_order
            } for p in plans]
        }), 200

    except Exception as e:
        logger.error(f"Get plans error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/superadmin/plans', methods=['POST'])
@jwt_required()
def create_plan():
    """Create new pricing plan"""
    try:
        claims = get_jwt()
        if claims.get('role') != 'superadmin':
            return jsonify({'error': 'Unauthorized'}), 403

        data = request.get_json()

        plan = Plan(
            name=data['name'],
            slug=data.get('slug', data['name'].lower().replace(' ', '-')),
            description=data.get('description'),
            monthly_price=data.get('monthly_price', 0),
            annual_price=data.get('annual_price'),
            setup_fee=data.get('setup_fee', 0),
            max_calls_per_month=data.get('max_calls_per_month', 100),
            max_users=data.get('max_users', 5),
            max_storage_gb=data.get('max_storage_gb', 10),
            max_recording_minutes=data.get('max_recording_minutes', 1000),
            has_api_access=data.get('has_api_access', False),
            has_white_label=data.get('has_white_label', False),
            has_priority_support=data.get('has_priority_support', False),
            trial_days=data.get('trial_days', 14),
            is_active=data.get('is_active', True),
            is_public=data.get('is_public', True),
            sort_order=data.get('sort_order', 0)
        )

        db.session.add(plan)
        db.session.commit()

        logger.info(f"Created plan: {plan.name} (ID: {plan.id})")

        return jsonify({
            'message': 'Plan created successfully',
            'plan': {
                'id': plan.id,
                'name': plan.name,
                'slug': plan.slug,
                'monthly_price': plan.monthly_price
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        logger.error(f"Create plan error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/superadmin/plans/<int:plan_id>', methods=['PUT'])
@jwt_required()
def update_plan(plan_id):
    """Update pricing plan"""
    try:
        claims = get_jwt()
        if claims.get('role') != 'superadmin':
            return jsonify({'error': 'Unauthorized'}), 403

        plan = Plan.query.get_or_404(plan_id)
        data = request.get_json()

        # Update fields
        for field in ['name', 'description', 'monthly_price', 'annual_price', 'setup_fee',
                      'max_calls_per_month', 'max_users', 'max_storage_gb', 'max_recording_minutes',
                      'has_api_access', 'has_white_label', 'has_priority_support',
                      'trial_days', 'is_active', 'is_public', 'sort_order']:
            if field in data:
                setattr(plan, field, data[field])

        db.session.commit()

        return jsonify({'message': 'Plan updated successfully'}), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Update plan error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/superadmin/plans/<int:plan_id>', methods=['DELETE'])
@jwt_required()
def delete_plan(plan_id):
    """Delete pricing plan"""
    try:
        claims = get_jwt()
        if claims.get('role') != 'superadmin':
            return jsonify({'error': 'Unauthorized'}), 403

        plan = Plan.query.get_or_404(plan_id)

        # Check if any active subscriptions
        active_subs = Subscription.query.filter_by(plan_id=plan_id, status='active').count()
        if active_subs > 0:
            return jsonify({'error': f'Cannot delete plan with {active_subs} active subscriptions'}), 400

        db.session.delete(plan)
        db.session.commit()

        return jsonify({'message': 'Plan deleted successfully'}), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Delete plan error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


# ============================================================================
# SUBSCRIPTIONS MANAGEMENT
# ============================================================================

@app.route('/api/superadmin/subscriptions', methods=['GET'])
@jwt_required()
def get_all_subscriptions():
    """Get all tenant subscriptions"""
    try:
        claims = get_jwt()
        if claims.get('role') != 'superadmin':
            return jsonify({'error': 'Unauthorized'}), 403

        status_filter = request.args.get('status')

        query = db.session.query(Subscription, Tenant, Plan).join(
            Tenant, Subscription.tenant_id == Tenant.id
        ).join(
            Plan, Subscription.plan_id == Plan.id
        )

        if status_filter:
            query = query.filter(Subscription.status == status_filter)

        subscriptions = query.order_by(Subscription.created_at.desc()).all()

        return jsonify({
            'subscriptions': [{
                'id': sub.id,
                'tenant': {
                    'id': tenant.id,
                    'company_name': tenant.company_name,
                    'subdomain': tenant.subdomain
                },
                'plan': {
                    'id': plan.id,
                    'name': plan.name,
                    'monthly_price': plan.monthly_price
                },
                'status': sub.status,
                'billing_cycle': sub.billing_cycle,
                'current_period_start': sub.current_period_start.isoformat() if sub.current_period_start else None,
                'current_period_end': sub.current_period_end.isoformat() if sub.current_period_end else None,
                'trial_end': sub.trial_end.isoformat() if sub.trial_end else None,
                'next_billing_date': sub.next_billing_date.isoformat() if sub.next_billing_date else None,
                'cancel_at_period_end': sub.cancel_at_period_end,
                'created_at': sub.created_at.isoformat()
            } for sub, tenant, plan in subscriptions]
        }), 200

    except Exception as e:
        logger.error(f"Get subscriptions error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


# ============================================================================
# REVENUE ANALYTICS
# ============================================================================

@app.route('/api/superadmin/analytics/revenue', methods=['GET'])
@jwt_required()
def get_revenue_analytics():
    """Get comprehensive revenue analytics"""
    try:
        claims = get_jwt()
        if claims.get('role') != 'superadmin':
            return jsonify({'error': 'Unauthorized'}), 403

        # Current MRR calculation
        active_subs = db.session.query(
            Subscription, Plan
        ).join(Plan).filter(
            Subscription.status.in_(['active', 'trialing'])
        ).all()

        mrr = sum(plan.monthly_price for sub, plan in active_subs if sub.billing_cycle == 'monthly')
        arr = mrr * 12

        # Count tenants by status
        total_tenants = Tenant.query.count()
        active_tenants = Subscription.query.filter_by(status='active').count()
        trial_tenants = Subscription.query.filter_by(status='trialing').count()
        churned_tenants = Subscription.query.filter_by(status='canceled').count()

        # Revenue by plan
        revenue_by_plan = db.session.query(
            Plan.name,
            func.sum(Plan.monthly_price).label('revenue'),
            func.count(Subscription.id).label('subscribers')
        ).join(Subscription).filter(
            Subscription.status == 'active'
        ).group_by(Plan.name).all()

        # Last 30 days metrics
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_metrics = RevenueMetric.query.filter(
            RevenueMetric.date >= thirty_days_ago.date()
        ).order_by(RevenueMetric.date).all()

        return jsonify({
            'current': {
                'mrr': round(mrr, 2),
                'arr': round(arr, 2),
                'total_tenants': total_tenants,
                'active_tenants': active_tenants,
                'trial_tenants': trial_tenants,
                'churned_tenants': churned_tenants,
                'churn_rate': round((churned_tenants / total_tenants * 100) if total_tenants > 0 else 0, 2)
            },
            'by_plan': [{
                'plan': name,
                'revenue': float(revenue),
                'subscribers': subscribers
            } for name, revenue, subscribers in revenue_by_plan],
            'historical': [{
                'date': m.date.isoformat(),
                'mrr': m.mrr,
                'arr': m.arr,
                'active_tenants': m.active_tenants,
                'new_tenants': m.new_tenants
            } for m in recent_metrics]
        }), 200

    except Exception as e:
        logger.error(f"Revenue analytics error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


# ============================================================================
# COST TRACKING & OPERATIONAL METRICS
# ============================================================================

@app.route('/api/superadmin/analytics/costs', methods=['GET'])
@jwt_required()
def get_cost_analytics():
    """Get cost breakdown and margins"""
    try:
        claims = get_jwt()
        if claims.get('role') != 'superadmin':
            return jsonify({'error': 'Unauthorized'}), 403

        # Total costs from call metrics
        total_costs = db.session.query(
            func.sum(CallMetric.total_cost).label('total')
        ).scalar() or 0

        # Costs this month
        first_of_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0)
        monthly_costs = db.session.query(
            func.sum(CallMetric.total_cost).label('total')
        ).join(CDRRecord).filter(
            CDRRecord.call_date >= first_of_month
        ).scalar() or 0

        # Cost per tenant
        cost_by_tenant = db.session.query(
            Tenant.company_name,
            func.sum(CallMetric.total_cost).label('cost'),
            func.count(CallMetric.id).label('calls')
        ).join(CallMetric, Tenant.id == CallMetric.tenant_id
        ).group_by(Tenant.company_name
        ).order_by(func.sum(CallMetric.total_cost).desc()
        ).limit(10).all()

        # Average cost per call
        avg_cost_per_call = db.session.query(
            func.avg(CallMetric.total_cost).label('avg')
        ).scalar() or 0

        return jsonify({
            'totals': {
                'all_time': round(total_costs, 2),
                'this_month': round(monthly_costs, 2),
                'avg_per_call': round(avg_cost_per_call, 4)
            },
            'by_tenant': [{
                'tenant': name,
                'cost': round(float(cost), 2),
                'calls': calls
            } for name, cost, calls in cost_by_tenant]
        }), 200

    except Exception as e:
        logger.error(f"Cost analytics error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/superadmin/analytics/system', methods=['GET'])
@jwt_required()
def get_system_metrics():
    """Get system health and performance metrics"""
    try:
        claims = get_jwt()
        if claims.get('role') != 'superadmin':
            return jsonify({'error': 'Unauthorized'}), 403

        # API usage stats
        total_calls = CDRRecord.query.count()
        calls_today = CDRRecord.query.filter(
            func.date(CDRRecord.call_date) == datetime.utcnow().date()
        ).count()

        # Processing time averages
        avg_processing_time = db.session.query(
            func.avg(CallMetric.processing_time_seconds).label('avg')
        ).scalar() or 0

        # Recent system metrics
        recent_metrics = SystemMetric.query.filter(
            SystemMetric.timestamp >= datetime.utcnow() - timedelta(hours=24)
        ).order_by(SystemMetric.timestamp.desc()).limit(100).all()

        # Active alerts
        active_alerts = SystemAlert.query.filter_by(is_resolved=False).count()

        return jsonify({
            'calls': {
                'total': total_calls,
                'today': calls_today
            },
            'performance': {
                'avg_processing_time': round(avg_processing_time, 2)
            },
            'alerts': {
                'active': active_alerts
            },
            'recent_metrics': [{
                'timestamp': m.timestamp.isoformat(),
                'type': m.metric_type,
                'value': m.value,
                'unit': m.unit
            } for m in recent_metrics[:20]]
        }), 200

    except Exception as e:
        logger.error(f"System metrics error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


# ============================================================================
# SYSTEM ALERTS
# ============================================================================

@app.route('/api/superadmin/alerts', methods=['GET'])
@jwt_required()
def get_system_alerts():
    """Get all system alerts"""
    try:
        claims = get_jwt()
        if claims.get('role') != 'superadmin':
            return jsonify({'error': 'Unauthorized'}), 403

        show_resolved = request.args.get('resolved', 'false').lower() == 'true'

        query = SystemAlert.query
        if not show_resolved:
            query = query.filter_by(is_resolved=False)

        alerts = query.order_by(SystemAlert.created_at.desc()).limit(100).all()

        return jsonify({
            'alerts': [{
                'id': a.id,
                'alert_type': a.alert_type,
                'severity': a.severity,
                'title': a.title,
                'message': a.message,
                'tenant_id': a.tenant_id,
                'metric_value': a.metric_value,
                'threshold_value': a.threshold_value,
                'is_resolved': a.is_resolved,
                'resolved_at': a.resolved_at.isoformat() if a.resolved_at else None,
                'created_at': a.created_at.isoformat()
            } for a in alerts]
        }), 200

    except Exception as e:
        logger.error(f"Get alerts error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/superadmin/alerts/<int:alert_id>/resolve', methods=['POST'])
@jwt_required()
def resolve_alert(alert_id):
    """Resolve a system alert"""
    try:
        claims = get_jwt()
        if claims.get('role') != 'superadmin':
            return jsonify({'error': 'Unauthorized'}), 403

        alert = SystemAlert.query.get_or_404(alert_id)
        alert.is_resolved = True
        alert.resolved_at = datetime.utcnow()
        alert.resolved_by = get_jwt_identity()

        db.session.commit()

        return jsonify({'message': 'Alert resolved'}), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Resolve alert error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


# ============================================================================
# FEATURE FLAGS
# ============================================================================

@app.route('/api/superadmin/feature-flags', methods=['GET'])
@jwt_required()
def get_feature_flags():
    """Get all feature flags"""
    try:
        claims = get_jwt()
        if claims.get('role') != 'superadmin':
            return jsonify({'error': 'Unauthorized'}), 403

        flags = FeatureFlag.query.order_by(FeatureFlag.name).all()

        return jsonify({
            'flags': [{
                'id': f.id,
                'name': f.name,
                'slug': f.slug,
                'description': f.description,
                'is_enabled': f.is_enabled,
                'rollout_percentage': f.rollout_percentage,
                'target_plan_ids': json.loads(f.target_plan_ids) if f.target_plan_ids else [],
                'target_tenant_ids': json.loads(f.target_tenant_ids) if f.target_tenant_ids else [],
                'created_at': f.created_at.isoformat()
            } for f in flags]
        }), 200

    except Exception as e:
        logger.error(f"Get feature flags error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/superadmin/feature-flags', methods=['POST'])
@jwt_required()
def create_feature_flag():
    """Create new feature flag"""
    try:
        claims = get_jwt()
        if claims.get('role') != 'superadmin':
            return jsonify({'error': 'Unauthorized'}), 403

        data = request.get_json()

        flag = FeatureFlag(
            name=data['name'],
            slug=data.get('slug', data['name'].lower().replace(' ', '-')),
            description=data.get('description'),
            is_enabled=data.get('is_enabled', False),
            rollout_percentage=data.get('rollout_percentage', 0),
            target_plan_ids=json.dumps(data.get('target_plan_ids', [])),
            target_tenant_ids=json.dumps(data.get('target_tenant_ids', [])),
            created_by=get_jwt_identity()
        )

        db.session.add(flag)
        db.session.commit()

        return jsonify({
            'message': 'Feature flag created',
            'flag': {'id': flag.id, 'name': flag.name}
        }), 201

    except Exception as e:
        db.session.rollback()
        logger.error(f"Create feature flag error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/superadmin/feature-flags/<int:flag_id>', methods=['PUT'])
@jwt_required()
def update_feature_flag(flag_id):
    """Update feature flag"""
    try:
        claims = get_jwt()
        if claims.get('role') != 'superadmin':
            return jsonify({'error': 'Unauthorized'}), 403

        flag = FeatureFlag.query.get_or_404(flag_id)
        data = request.get_json()

        for field in ['name', 'description', 'is_enabled', 'rollout_percentage']:
            if field in data:
                setattr(flag, field, data[field])

        if 'target_plan_ids' in data:
            flag.target_plan_ids = json.dumps(data['target_plan_ids'])
        if 'target_tenant_ids' in data:
            flag.target_tenant_ids = json.dumps(data['target_tenant_ids'])

        db.session.commit()

        return jsonify({'message': 'Feature flag updated'}), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Update feature flag error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


# Add these endpoints to app.py after the existing super admin endpoints
